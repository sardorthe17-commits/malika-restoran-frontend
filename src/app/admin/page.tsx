"use client";

import { useEffect, useState } from "react";
import { Users, UtensilsCrossed, Tag, ClipboardList, TrendingUp, Wallet, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { formatSom } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";

interface Stats {
  userCount: number;
  productCount: number;
  categoryCount: number;
  orderCount: number;
  ordersToday: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueTotal: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ success: boolean; message?: string; data?: Stats }>("/order/stats");
        if (!res.success) {
          setError(res.message ?? "Statistikani yuklab bo'lmadi");
          return;
        }
        setStats(res.data ?? null);
      } catch {
        setError("Server bilan bog'lanishda xatolik");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = stats
    ? [
        { label: "Bugungi buyurtmalar", value: stats.ordersToday, icon: CalendarClock },
        { label: "Foydalanuvchilar", value: stats.userCount, icon: Users },
        { label: "Mahsulotlar", value: stats.productCount, icon: UtensilsCrossed },
        { label: "Kategoriyalar", value: stats.categoryCount, icon: Tag },
        { label: "Buyurtmalar (jami)", value: stats.orderCount, icon: ClipboardList },
        { label: "Bu oy buyurtmalar", value: stats.ordersThisMonth, icon: TrendingUp },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-dark">Bosh sahifa</h1>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Bugungi tushum — eng muhim ko'rsatkich, alohida ajratilgan */}
          <div className="frame col-span-2 border-teal/40 bg-teal/5 p-4 sm:col-span-3">
            <Wallet className="mb-2 h-5 w-5 text-teal" aria-hidden="true" />
            <p className="font-display text-2xl font-semibold text-dark">{formatSom(stats.revenueToday)}</p>
            <p className="text-xs text-dark/60">Bugungi tushum</p>
          </div>

          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="frame p-4">
              <Icon className="mb-2 h-5 w-5 text-teal" aria-hidden="true" />
              <p className="text-2xl font-semibold text-dark">{value}</p>
              <p className="text-xs text-dark/60">{label}</p>
            </div>
          ))}

          <div className="frame col-span-2 p-4 sm:col-span-1">
            <Wallet className="mb-2 h-5 w-5 text-olive" aria-hidden="true" />
            <p className="text-lg font-semibold text-dark">{formatSom(stats.revenueThisMonth)}</p>
            <p className="text-xs text-dark/60">Bu oy tushum</p>
          </div>

          <div className="frame col-span-2 p-4 sm:col-span-1">
            <Wallet className="mb-2 h-5 w-5 text-olive" aria-hidden="true" />
            <p className="text-lg font-semibold text-dark">{formatSom(stats.revenueTotal)}</p>
            <p className="text-xs text-dark/60">Umumiy tushum</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
