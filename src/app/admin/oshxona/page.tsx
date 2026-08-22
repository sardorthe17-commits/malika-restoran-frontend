"use client";

import { useEffect, useRef, useState } from "react";
import { ChefHat, Armchair, MapPin, Clock, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Order } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { openPrintWindow } from "@/lib/printWindow";
import { buildKitchenTicketHtml } from "@/lib/receiptHtml";

interface PopulatedOrder extends Omit<Order, "tabel_id"> {
  tabel_id?: { _id: string; stol_raqami?: number; atmosfera_id?: { atmosfera?: string } } | string;
}

// Kitchen uchun "haqiqiy, tayyorlash kerak bo'lgan" buyurtma — hali admin
// tasdiqini kutayotgan (PENDING_REVIEW) stol so'rovlari bunga kirmaydi.
function isKitchenRelevant(o: PopulatedOrder) {
  if (o.status === "CANCELLED" || o.status === "DELIVERED") return false;
  if (o.approval_status === "PENDING_REVIEW") return false;
  return true;
}

function orderLabel(o: PopulatedOrder) {
  const table = typeof o.tabel_id === "object" ? o.tabel_id : null;
  if (table) return `${table.atmosfera_id?.atmosfera ?? ""} — ${table.stol_raqami}-stol`;
  if (o.address) return `Onlayn: ${o.address.label}`;
  return "Buyurtma";
}

function printTicket(o: PopulatedOrder) {
  const table = typeof o.tabel_id === "object" ? o.tabel_id : null;
  const html = buildKitchenTicketHtml({
    atmosferaName: table?.atmosfera_id?.atmosfera,
    tableNumber: table?.stol_raqami,
    orderLabel: orderLabel(o),
    items: o.items,
    createdAt: o.createdAt,
  });
  openPrintWindow(html, "Oshxona taomnomasi");
}

export default function AdminOshxonaPage() {
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const printedIds = useRef<Set<string>>(new Set());

  const load = async () => {
    try {
      const res = await api.get<PopulatedOrder[]>("/order");
      const relevant = Array.isArray(res) ? res.filter(isKitchenRelevant) : [];
      setOrders(relevant);
      // Sahifa birinchi ochilganda mavjud buyurtmalarni qayta chop etmaymiz —
      // faqat shundan keyin kelgan YANGI buyurtmalar avtomatik chop etiladi.
      relevant.forEach((o) => printedIds.current.add(o._id));
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

  const autoPrint = (o: PopulatedOrder) => {
    if (printedIds.current.has(o._id)) return;
    printedIds.current.add(o._id);
    printTicket(o);
  };

  useEffect(() => {
    const socket = getSocket();

    const onNewOrder = (o: PopulatedOrder) => {
      if (!isKitchenRelevant(o)) return;
      setOrders((prev) => (prev.some((x) => x._id === o._id) ? prev : [o, ...prev]));
      autoPrint(o);
    };

    const onReservationDecided = (o: PopulatedOrder) => {
      if (!o || !o._id) return;
      if (o.approval_status === "CONFIRMED") {
        setOrders((prev) => (prev.some((x) => x._id === o._id) ? prev : [o, ...prev]));
        autoPrint(o);
      }
    };

    const onStatusChanged = () => load();
    const onCancelled = () => load();

    socket.on("new-order", onNewOrder);
    socket.on("reservation-decided", onReservationDecided);
    socket.on("order-status-changed", onStatusChanged);
    socket.on("order-cancelled", onCancelled);
    return () => {
      socket.off("new-order", onNewOrder);
      socket.off("reservation-decided", onReservationDecided);
      socket.off("order-status-changed", onStatusChanged);
      socket.off("order-cancelled", onCancelled);
    };
     
  }, []);

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <ChefHat className="h-6 w-6 text-teal" />
        Oshxona
      </h1>
      <p className="mb-6 text-xs text-dark/50">
        Bu sahifani oshxonadagi kompyuter/planshetda ochiq qoldiring — yangi buyurtma kelganda avtomatik
        yangi oynada chop etish so&apos;rovi ochiladi (agar shu terminalda printer standart printer qilib
        sozlangan bo&apos;lsa, faqat &quot;Chop etish&quot;ni bosish kifoya).
      </p>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState icon={ChefHat} title="Hozircha tayyorlanadigan buyurtma yo'q" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => {
            const table = typeof o.tabel_id === "object" ? o.tabel_id : null;
            return (
              <div key={o._id} className="frame p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-dark">
                    {table ? <Armchair className="h-4 w-4 text-teal" /> : <MapPin className="h-4 w-4 text-teal" />}
                    {orderLabel(o)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-dark/50">
                    <Clock className="h-3 w-3" />
                    {new Date(o.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <ul className="mb-3 flex flex-col gap-1 text-sm">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between font-medium text-dark">
                      <span>{it.title}</span>
                      <span>x{it.qty}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => printTicket(o)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-dark/15 px-3 py-2 text-xs font-medium text-dark hover:border-teal"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Qayta chop etish
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
