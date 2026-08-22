"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Phone, MessageCircle, X, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import type { Order } from "@/lib/types";
import { formatSom, toDateParts } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";

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

// Stol (restoranda o'tirib beriladigan) buyurtmalar uchun mijozga
// Tayyorlanmoqda/Yetkazilmoqda/Yetkazildi kabi bosqichlar ko'rsatilmaydi —
// mijoz restoranning o'zida bo'lgani uchun bu bosqichlar keraksiz va
// chalkashtiradi. Faqat "Kutilmoqda" (yoki bekor qilingan bo'lsa shu) ko'rinadi.
function clientStatusInfo(o: Order) {
  if (o.tabel_id) {
    if (o.approval_status === "PENDING_REVIEW") {
      return { label: "Tasdiqlanishi kutilmoqda", color: "bg-olive/10 text-olive" };
    }
    if (o.approval_status === "REJECTED" || o.status === "CANCELLED") {
      return { label: "Bekor qilindi", color: STATUS_COLOR.CANCELLED };
    }
    // CONFIRMED (yoki eski, approval_status yo'q buyurtmalar)
    return { label: "Kutilmoqda", color: STATUS_COLOR.PENDING };
  }
  return { label: STATUS_LABEL[o.status] ?? o.status, color: STATUS_COLOR[o.status] ?? "bg-dark/10 text-dark" };
}

// "Bugungi" — stol bilan berilgan buyurtmalar uchun QACHON yaratilganiga emas,
// QAYSI SANAGA bron qilinganiga qaraladi (mijoz o'sha kuni restoranga keladi).
// Online (yetkazib berish) buyurtmalar uchun esa oddiy yaratilgan sanasi ishlatiladi.
function isRelevantToday(order: Order) {
  if (order.bron_kun != null && order.bron_oy && order.bron_yil != null) {
    const today = toDateParts(new Date().toISOString().slice(0, 10));
    return order.bron_kun === today.kun && order.bron_oy === today.oy && order.bron_yil === today.yil;
  }
  const d = new Date(order.createdAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "all">("today");
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Order[]>("/order/mine");
      setOrders(Array.isArray(res) ? res : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      await load();
      const contact = await api
        .get<{ success: boolean; phone?: string }>("/contact-phone")
        .catch(() => null);
      setAdminPhone(contact?.phone ?? null);
    })();
  }, [user]);

  // Buyurtma holati o'zgarganda (masalan admin "tayyorlanmoqda" deb belgilasa)
  // sahifani yangilamasdan darhol ko'ramiz.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const refresh = () => load();
    socket.on("order-status-changed", refresh);
    socket.on("order-cancelled", refresh);
    return () => {
      socket.off("order-status-changed", refresh);
      socket.off("order-cancelled", refresh);
    };
     
  }, [user]);

  const visible = useMemo(
    () => (filter === "today" ? orders.filter((o) => isRelevantToday(o)) : orders),
    [orders, filter]
  );

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await api.patch(`/order/${id}/cancel`);
      await load();
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      <h1 className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <ClipboardList className="h-6 w-6 text-teal" />
        Buyurtmam
      </h1>

      {authLoading || loading ? (
        <Spinner />
      ) : !user ? (
        <EmptyState icon={ClipboardList} title="Avval tizimga kiring" description="Buyurtmalaringizni ko'rish uchun hisobingizga kiring." />
      ) : (
        <>
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
              onClick={() => setFilter("all")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === "all" ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
              }`}
            >
              Barchasi
            </button>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Buyurtmalar topilmadi" />
          ) : (
            <div className="flex flex-col gap-4">
              {visible.map((o) => {
                // Buyurtma yaratilgandan beri o'tgan vaqtni ko'rsatish uchun joriy vaqt bilan solishtiramiz
                // eslint-disable-next-line react-hooks/purity
                const minutesPassed = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
                const canCancel = o.status === "PENDING";
                const cancellable = canCancel && minutesPassed <= 20;
                const readyAt = new Date(new Date(o.createdAt).getTime() + (o.estimated_minutes ?? 40) * 60000);
                const finished = o.status === "CANCELLED" || o.status === "DELIVERED";

                return (
                  <div key={o._id} className="frame p-4 sm:p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-dark/50">
                        {new Date(o.createdAt).toLocaleString("uz-UZ")}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clientStatusInfo(o).color}`}
                      >
                        {clientStatusInfo(o).label}
                      </span>
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

                    {o.tabel_id && o.approval_status === "PENDING_REVIEW" && (
                      <div className="mb-3 rounded-lg bg-olive/10 px-3 py-2 text-xs text-dark/70">
                        Bronni tasdiqlash uchun admin siz bilan chat orqali bog&apos;lanadi (to&apos;lov
                        skrinshotini yuborishingiz kerak bo&apos;ladi).{" "}
                        <a href="/chat" className="font-medium text-teal hover:underline">
                          Chatni ochish
                        </a>
                      </div>
                    )}

                    {!finished && o.approval_status !== "PENDING_REVIEW" && (
                      <div className="mb-3 flex items-center gap-1.5 text-xs text-dark/60">
                        <Clock className="h-3.5 w-3.5" />
                        Taxminan tayyor bo&apos;lish vaqti:{" "}
                        {readyAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {cancellable && (
                        <button
                          onClick={() => handleCancel(o._id)}
                          disabled={cancellingId === o._id}
                          className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          {cancellingId === o._id ? "Bekor qilinmoqda..." : "Bekor qilish"}
                        </button>
                      )}
                      {!finished && (
                        <a
                          href="/chat"
                          className="flex items-center gap-1.5 rounded-full border border-teal/40 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Admin bilan chat
                        </a>
                      )}
                      {adminPhone && !finished && (
                        <a
                          href={`tel:${adminPhone}`}
                          className="flex items-center gap-1.5 rounded-full border border-teal/40 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Qo&apos;ng&apos;iroq qilish
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
