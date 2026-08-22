"use client";

import { useEffect, useState } from "react";
import { Armchair, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useSelection } from "@/context/SelectionContext";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import { toDateParts } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { Receipt } from "@/components/Receipt";

export default function MyTablePage() {
  const { selection } = useSelection();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<Order[]>("/order/mine");
        setOrders(Array.isArray(res) ? res : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const tableOrders = selection?.tabel
    ? orders.filter((o) => {
        const tId = typeof o.tabel_id === "string" ? o.tabel_id : (o.tabel_id as { _id?: string } | undefined)?._id;
        if (tId !== selection.tabel!._id) return false;
        const { kun, oy, yil } = toDateParts(selection.isoDate);
        return o.bron_kun === kun && o.bron_oy === oy && o.bron_yil === yil;
      })
    : [];

  const allItems = tableOrders.flatMap((o) => o.items);
  const serviceFeePercent = selection?.atmosfera.xizmat_haqi_foizi ?? 0;
  const { kun, oy, yil } = selection ? toDateParts(selection.isoDate) : { kun: 0, oy: "", yil: 0 };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      <h1 className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <Armchair className="h-6 w-6 text-teal" />
        Meni stolim
      </h1>

      {authLoading || loading ? (
        <Spinner />
      ) : !user ? (
        <EmptyState
          icon={Armchair}
          title="Avval tizimga kiring"
          description="Stol ma'lumotlarini ko'rish uchun hisobingizga kiring."
        />
      ) : !selection || !selection.tabel ? (
        <EmptyState
          icon={MapPin}
          title="Hozircha stol tanlanmagan"
          description="Menyu sahifasida atmosfera va stol tanlang."
        />
      ) : tableOrders.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="Hali bu stolga buyurtma berilmagan"
          description="Menyudan taom tanlab, savatga qo'shing."
        />
      ) : (
        <Receipt
          customerName={user.fullName}
          customerPhone={user.phone}
          atmosferaName={selection.atmosfera.atmosfera}
          tableNumber={selection.tabel.stol_raqami}
          kun={kun}
          oy={oy}
          yil={yil}
          soat={selection.soat ?? 0}
          davomiylikSoat={selection.davomiylikSoat ?? 0}
          items={allItems}
          serviceFeePercent={serviceFeePercent}
          depositPaid={tableOrders.reduce((sum, o) => sum + (o.zalog_tolandi ?? 0), 0)}
        />
      )}
    </div>
  );
}
