"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, X, Loader2, MapPin, Phone, ChevronRight, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Order, OrderStatus } from "@/lib/types";
import { formatSom, toDateParts } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Receipt } from "@/components/Receipt";

interface PopulatedOrder extends Omit<Order, "user_id" | "tabel_id"> {
  user_id: { _id: string; fullName?: string; phone?: string } | string;
  tabel_id?: { _id: string; stol_raqami?: number; atmosfera_id?: { atmosfera?: string; xizmat_haqi_foizi?: number } } | string;
}

// "Bugungi" — buyurtma QACHON yaratilganiga emas, stol QAYSI SANAGA bron
// qilinganiga qarab aniqlanadi. Masalan 12-martda yaratilgan, lekin 15-martga
// bron qilingan buyurtma faqat 15-mart kelganda "Bugungi" filtrida ko'rinadi —
// chunki mijoz haqiqatda o'sha kuni keladi.
function isReservationToday(order: Pick<Order, "bron_kun" | "bron_oy" | "bron_yil">) {
  if (order.bron_kun == null || !order.bron_oy || order.bron_yil == null) return false;
  const today = toDateParts(new Date().toISOString().slice(0, 10));
  return order.bron_kun === today.kun && order.bron_oy === today.oy && order.bron_yil === today.yil;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  PREPARING: "Tayyorlanmoqda",
  DELIVERING: "Yetkazilmoqda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-teal/10 text-teal",
  PREPARING: "bg-olive/10 text-olive",
  DELIVERING: "bg-blue-50 text-blue-600",
  DELIVERED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

// Stol buyurtmasi uchun "DELIVERED" holati "yetkazildi" emas, balki
// "hisob-kitob qilinib bo'ldi" degani (stol bo'shadi)
function statusLabel(status: string, isTableOrder: boolean) {
  if (isTableOrder && status === "DELIVERED") return "Yakunlandi";
  return STATUS_LABEL[status] ?? status;
}

// Har bir holatdan keyingi bosqichga o'tish tartibi.
// Onlayn (yetkazib berish) buyurtmalar to'liq bosqichdan o'tadi, stol
// (restoranda) buyurtmalari esa "Yetkazilmoqda"siz — mijoz shu yerda
// o'tirgani uchun bu bosqich mantiqsiz.
const NEXT_STATUS_ONLINE: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "DELIVERING",
  DELIVERING: "DELIVERED",
};
const NEXT_STATUS_TABLE: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "DELIVERED",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "online" | "all">("today");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newOrderBanner, setNewOrderBanner] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<PopulatedOrder[]>("/order");
      setOrders(Array.isArray(res) ? res : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (() => {
      load();
    })();
  }, []);

  // Yangi buyurtma yoki holat o'zgarishi haqida real-vaqtda xabar olamiz
  useEffect(() => {
    const socket = getSocket();
    const onNewOrder = () => {
      setNewOrderBanner(true);
      load();
    };
    const onChanged = () => load();
    socket.on("new-order", onNewOrder);
    socket.on("order-status-changed", onChanged);
    socket.on("order-cancelled", onChanged);
    return () => {
      socket.off("new-order", onNewOrder);
      socket.off("order-status-changed", onChanged);
      socket.off("order-cancelled", onChanged);
    };
  }, []);

  const visible = useMemo(() => {
    if (filter === "today") return orders.filter((o) => isReservationToday(o) && !o.address);
    if (filter === "online") return orders.filter((o) => !!o.address);
    return orders;
  }, [orders, filter]);

  const handleCancel = async (id: string) => {
    setBusyId(id);
    try {
      await api.patch(`/order/${id}/cancel`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvance = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      await api.patch(`/order/${id}/status`, { status });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <ClipboardList className="h-6 w-6 text-teal" />
        Buyurtmalar
      </h1>

      {newOrderBanner && (
        <button
          onClick={() => {
            setNewOrderBanner(false);
            setFilter("today");
          }}
          className="mb-4 flex w-full items-center gap-2 rounded-lg bg-olive/15 px-4 py-2.5 text-sm font-medium text-dark"
        >
          <Bell className="h-4 w-4 text-olive" />
          Yangi buyurtma keldi!
        </button>
      )}

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setFilter("today")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            filter === "today" ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
          }`}
        >
          Bugungi
        </button>
        <button
          onClick={() => setFilter("online")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            filter === "online" ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
          }`}
        >
          Online
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            filter === "all" ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
          }`}
        >
          Barcha buyurtmalar
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Buyurtmalar topilmadi" />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((o) => {
            const customer = typeof o.user_id === "object" ? o.user_id : null;
            const table = typeof o.tabel_id === "object" ? o.tabel_id : null;
            const isTableOrder = !!table;
            const pendingReview = isTableOrder && o.approval_status === "PENDING_REVIEW";
            const next = isTableOrder ? NEXT_STATUS_TABLE[o.status] : NEXT_STATUS_ONLINE[o.status];
            const finished = o.status === "CANCELLED" || o.status === "DELIVERED";
            // Stol buyurtmasida "Yetkazildi" — hisob-kitob qilinib, stol bo'shatilishini bildiradi
            const nextLabel = isTableOrder && next === "DELIVERED" ? "Hisob-kitob qilindi (stolni bo'shatish)" : next ? `${STATUS_LABEL[next]}ga o'tkazish` : "";

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
                  {pendingReview ? (
                    <span className="rounded-full bg-olive/10 px-2.5 py-0.5 text-xs font-semibold text-olive">
                      Tasdiqlanishi kutilmoqda —{" "}
                      <a href="/admin/bron" className="underline">
                        Bron sahifasida
                      </a>
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_COLOR[o.status] ?? "bg-dark/10 text-dark"
                      }`}
                    >
                      {statusLabel(o.status, isTableOrder)}
                    </span>
                  )}
                </div>

                {table ? (
                  <div className="mb-3">
                    <Receipt
                      atmosferaName={table.atmosfera_id?.atmosfera ?? ""}
                      tableNumber={table.stol_raqami ?? 0}
                      kun={o.bron_kun ?? 0}
                      oy={o.bron_oy ?? ""}
                      yil={o.bron_yil ?? 0}
                      soat={o.bron_soat ?? 0}
                      davomiylikSoat={o.bron_davomiylik_soat ?? 0}
                      items={o.items}
                      serviceFeePercent={table.atmosfera_id?.xizmat_haqi_foizi ?? 0}
                      depositPaid={o.zalog_tolandi ?? 0}
                    />
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-dark/60">
                      {o.address && (
                        <>
                          <MapPin className="h-3.5 w-3.5" /> {o.address.label}: {o.address.address_text}
                        </>
                      )}
                      <span className="ml-auto">{new Date(o.createdAt).toLocaleString("uz-UZ")}</span>
                    </div>

                    <ul className="mb-2 flex flex-col gap-1 text-sm text-dark/80">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {it.title} × {it.qty}
                          </span>
                          <span>{formatSom(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mb-3 flex items-center justify-between border-t border-dark/10 pt-2 font-semibold text-dark">
                      <span>Jami</span>
                      <span>{formatSom(o.total)}</span>
                    </div>
                  </>
                )}

                {!finished && !pendingReview && (
                  <div className="flex flex-wrap gap-2">
                    {next && (
                      <button
                        onClick={() => handleAdvance(o._id, next)}
                        disabled={busyId === o._id}
                        className="flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50"
                      >
                        {busyId === o._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {nextLabel}
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(o._id)}
                      disabled={busyId === o._id}
                      className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Bekor qilish
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
