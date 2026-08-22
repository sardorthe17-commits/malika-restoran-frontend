"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Armchair, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { Atmosfera, Tabel, Order } from "@/lib/types";
import { toDateParts } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

function isoOf(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function AdminPlacesPage() {
  const [atmosferas, setAtmosferas] = useState<Atmosfera[]>([]);
  const [tables, setTables] = useState<Tabel[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0); // 0 = bugun, 1 = ertaga
  const [activeAtmosfera, setActiveAtmosfera] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [atms, tabs, ords] = await Promise.all([
          api.get<Atmosfera[]>("/atmosfera"),
          api.get<Tabel[]>("/tabel"),
          api.get<Order[]>("/order"),
        ]);
        setAtmosferas(Array.isArray(atms) ? atms : []);
        setTables(Array.isArray(tabs) ? tabs : []);
        setOrders(Array.isArray(ords) ? ords : []);
        if (Array.isArray(atms) && atms.length > 0) setActiveAtmosfera(atms[0]._id);
      } catch {
        setAtmosferas([]);
        setTables([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isoDate = isoOf(dayOffset);
  const { kun, oy, yil } = useMemo(() => toDateParts(isoDate), [isoDate]);

  // Shu kun uchun har bir stolga tegishli bron qilingan vaqt oraliqlari
  const bookingsByTable = useMemo(() => {
    const map = new Map<string, { soat: number; davomiylik: number }[]>();
    for (const o of orders) {
      if (o.status === "CANCELLED" || o.status === "DELIVERED") continue;
      if (o.bron_kun !== kun || o.bron_oy !== oy || o.bron_yil !== yil) continue;
      const tId = typeof o.tabel_id === "string" ? o.tabel_id : (o.tabel_id as { _id?: string } | undefined)?._id;
      if (!tId || o.bron_soat == null) continue;
      const list = map.get(tId) ?? [];
      list.push({ soat: o.bron_soat, davomiylik: o.bron_davomiylik_soat ?? 1 });
      map.set(tId, list);
    }
    return map;
  }, [orders, kun, oy, yil]);

  const summaryByAtmosfera = useMemo(() => {
    return atmosferas.map((a) => {
      const atmosferaTables = tables.filter((t) => {
        const tId = typeof t.atmosfera_id === "string" ? t.atmosfera_id : t.atmosfera_id?._id;
        return tId === a._id;
      });
      const bookedCount = atmosferaTables.filter((t) => (bookingsByTable.get(t._id)?.length ?? 0) > 0).length;
      return {
        atmosfera: a,
        total: atmosferaTables.length,
        booked: bookedCount,
        free: atmosferaTables.length - bookedCount,
        tables: atmosferaTables,
      };
    });
  }, [atmosferas, tables, bookingsByTable]);

  const active = summaryByAtmosfera.find((s) => s.atmosfera._id === activeAtmosfera);

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <MapIcon className="h-6 w-6 text-teal" />
        Joylar
      </h1>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setDayOffset(0)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            dayOffset === 0 ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
          }`}
        >
          Bugun
        </button>
        <button
          onClick={() => setDayOffset(1)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            dayOffset === 1 ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
          }`}
        >
          Ertaga
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : atmosferas.length === 0 ? (
        <EmptyState icon={MapIcon} title="Hozircha joy qo'shilmagan" />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {summaryByAtmosfera.map((s) => (
              <button
                key={s.atmosfera._id}
                onClick={() => setActiveAtmosfera(s.atmosfera._id)}
                className={`frame p-4 text-left transition ${
                  activeAtmosfera === s.atmosfera._id ? "ring-2 ring-teal" : ""
                }`}
              >
                <p className="font-display font-semibold text-dark">{s.atmosfera.atmosfera}</p>
                <p className="mt-1 text-xs text-dark/60">{s.total} ta stol</p>
                <p className="mt-2 text-xs text-teal">{s.free} bo&apos;sh · {s.booked} bugun bron qilingan</p>
              </button>
            ))}
          </div>

          {active && (
            <div>
              <h2 className="mb-3 font-display text-base font-semibold text-dark">
                {active.atmosfera.atmosfera} — {isoDate}
              </h2>
              {active.tables.length === 0 ? (
                <EmptyState
                  icon={Armchair}
                  title="Bu atmosferada hali stol yo'q"
                  description="Admin panelning 'Stollar' bo'limida yarating."
                />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {active.tables
                    .sort((a, b) => a.stol_raqami - b.stol_raqami)
                    .map((t) => {
                      const bookings = (bookingsByTable.get(t._id) ?? []).sort((a, b) => a.soat - b.soat);
                      return (
                        <div key={t._id} className="frame p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-semibold text-dark">{t.stol_raqami}-stol</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                bookings.length > 0 ? "bg-red-50 text-red-500" : "bg-teal/10 text-teal"
                              }`}
                            >
                              {bookings.length > 0 ? "Bron qilingan" : "Bo'sh"}
                            </span>
                          </div>
                          {bookings.length > 0 && (
                            <ul className="flex flex-col gap-1">
                              {bookings.map((b, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 text-xs text-dark/60">
                                  <Clock className="h-3 w-3" />
                                  {b.soat}:00 — {b.soat + b.davomiylik}:00
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
