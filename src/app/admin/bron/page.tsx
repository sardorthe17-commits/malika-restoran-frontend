"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Phone, Armchair, Clock, MessageCircle, Check, X, Loader2, Bell, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Order } from "@/lib/types";
import { formatSom } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

interface PopulatedOrder extends Omit<Order, "user_id" | "tabel_id"> {
  user_id: { _id: string; fullName?: string; phone?: string } | string;
  tabel_id?: { _id: string; stol_raqami?: number; atmosfera_id?: { atmosfera?: string } } | string;
}

export default function AdminBronPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PopulatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState(false);
  const [depositInputs, setDepositInputs] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const res = await api.get<PopulatedOrder[]>("/order/reservations");
      setRequests(Array.isArray(res) ? res : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (() => {
      load();
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onNew = () => {
      setNewBanner(true);
      load();
    };
    const onDecided = () => load();
    socket.on("new-reservation-request", onNew);
    socket.on("reservation-decided", onDecided);
    return () => {
      socket.off("new-reservation-request", onNew);
      socket.off("reservation-decided", onDecided);
    };
  }, []);

  const handleApprove = async (id: string) => {
    const raw = depositInputs[id];
    if (!raw || Number(raw) <= 0) {
      alert("Bronni tasdiqlashdan oldin mijoz to'lagan zalog summasini kiriting.");
      return;
    }
    setBusyId(id);
    try {
      await api.patch(`/order/${id}/approve`, { zalog_tolandi: Number(raw) });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Bu bron so'rovini rad etmoqchimisiz?")) return;
    setBusyId(id);
    try {
      await api.patch(`/order/${id}/reject`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <ClipboardCheck className="h-6 w-6 text-teal" />
        Bron so&apos;rovlari
      </h1>

      {newBanner && (
        <button
          onClick={() => setNewBanner(false)}
          className="mb-4 flex w-full items-center gap-2 rounded-lg bg-olive/15 px-4 py-2.5 text-sm font-medium text-dark"
        >
          <Bell className="h-4 w-4 text-olive" />
          Yangi bron so&apos;rovi keldi!
        </button>
      )}

      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Hozircha bron so'rovlari yo'q"
          description="Mijoz stol tanlab buyurtma berganda, so'rov shu yerda ko'rinadi."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((o) => {
            const customer = typeof o.user_id === "object" ? o.user_id : null;
            const table = typeof o.tabel_id === "object" ? o.tabel_id : null;

            return (
              <div key={o._id} className="frame p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-dark">{customer?.fullName ?? "Noma'lum mijoz"}</p>
                    {customer?.phone && (
                      <p className="flex items-center gap-1 text-xs text-dark/50">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-olive/10 px-2.5 py-0.5 text-xs font-semibold text-olive">
                    Tasdiqlanishi kutilmoqda
                  </span>
                </div>

                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark/60">
                  {table && (
                    <span className="flex items-center gap-1">
                      <Armchair className="h-3.5 w-3.5" />
                      {table.atmosfera_id?.atmosfera ?? ""} — {table.stol_raqami}-stol
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {o.bron_kun}-{o.bron_oy} {o.bron_yil}, soat {o.bron_soat}:00 dan {o.bron_davomiylik_soat} soatga
                  </span>
                </div>

                <ul className="mb-2 flex flex-col gap-1 text-sm text-dark/80">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{it.title} × {it.qty}</span>
                      <span>{formatSom(it.price * it.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-3 flex items-center justify-between border-t border-dark/10 pt-2 font-semibold text-dark">
                  <span>Jami</span>
                  <span>{formatSom(o.total)}</span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 rounded-lg border border-dark/15 px-3 py-2">
                    <Wallet className="h-4 w-4 shrink-0 text-teal" />
                    <input
                      type="number"
                      min={0}
                      value={depositInputs[o._id] ?? ""}
                      onChange={(e) => setDepositInputs((prev) => ({ ...prev, [o._id]: e.target.value }))}
                      placeholder="Mijoz to'lagan zalog summasi (so'm)"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => customer && router.push(`/admin/chat/${customer._id}`)}
                    className="flex items-center gap-1.5 rounded-full border border-teal/40 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chatga o&apos;tish (karta yuborish)
                  </button>
                  <button
                    onClick={() => handleApprove(o._id)}
                    disabled={busyId === o._id}
                    className="flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50"
                  >
                    {busyId === o._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Bron qilish
                  </button>
                  <button
                    onClick={() => handleReject(o._id)}
                    disabled={busyId === o._id}
                    className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Bekor qilish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
