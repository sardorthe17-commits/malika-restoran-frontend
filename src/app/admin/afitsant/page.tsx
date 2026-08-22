"use client";

import { useEffect, useMemo, useState } from "react";
import {
  UserCog,
  Armchair,
  Search,
  Plus,
  Minus,
  Loader2,
  ReceiptText,
  CheckCircle2,
  X,
  Printer,
} from "lucide-react";
import { api } from "@/lib/api";
import { toDateParts, formatSom } from "@/lib/utils";
import type { Atmosfera, Tabel, Category, Product, Order } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Receipt } from "@/components/Receipt";
import { openPrintWindow } from "@/lib/printWindow";
import { buildCashierReceiptHtml } from "@/lib/receiptHtml";

interface PopulatedOrder extends Omit<Order, "tabel_id" | "user_id"> {
  user_id: { _id: string; fullName?: string; phone?: string } | string;
  tabel_id?: { _id: string; stol_raqami?: number } | string;
}

interface TicketLine {
  product: Product;
  qty: number;
}

function isOnline(a: Atmosfera) {
  return a.atmosfera.trim().toLowerCase() === "online";
}

function nowIso() {
  return new Date().toISOString().slice(0, 10);
}

const FIXED_DURATION_HOURS = 3;

export default function AdminAfitsantPage() {
  const [atmosferas, setAtmosferas] = useState<Atmosfera[]>([]);
  const [tables, setTables] = useState<Tabel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [atmosferaId, setAtmosferaId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentHour = new Date().getHours();
  const { kun, oy, yil } = useMemo(() => toDateParts(nowIso()), []);

  const load = async () => {
    try {
      const [atms, cats, prods, ords] = await Promise.all([
        api.get<Atmosfera[]>("/atmosfera"),
        api.get<Category[]>("/category/all"),
        api.get<Product[]>("/product"),
        api.get<PopulatedOrder[]>("/order"),
      ]);
      const selectableAtms = Array.isArray(atms) ? atms.filter((a) => !isOnline(a)) : [];
      setAtmosferas(selectableAtms);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setOrders(Array.isArray(ords) ? ords : []);
      if (!atmosferaId && selectableAtms.length > 0) setAtmosferaId(selectableAtms[0]._id);
    } catch {
      setAtmosferas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (() => {
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!atmosferaId) return;
    (async () => {
      try {
        const res = await api.get<Tabel[]>(`/tabel?atmosfera_id=${atmosferaId}`);
        setTables(Array.isArray(res) ? res : []);
      } catch {
        setTables([]);
      }
    })();
  }, [atmosferaId]);

  // Shu stolga hozir (bugungi sana, joriy soat) tegishli faol buyurtma bormi
  const activeOrderForTable = (tableId: string) => {
    return orders.find((o) => {
      const tId = typeof o.tabel_id === "string" ? o.tabel_id : o.tabel_id?._id;
      if (tId !== tableId) return false;
      if (o.status === "CANCELLED" || o.status === "DELIVERED") return false;
      return o.bron_kun === kun && o.bron_oy === oy && o.bron_yil === yil;
    });
  };

  const sortedTables = useMemo(() => [...tables].sort((a, b) => a.stol_raqami - b.stol_raqami), [tables]);
  const selectedTable = sortedTables.find((t) => t._id === selectedTableId) ?? null;
  const selectedTableOrder = selectedTableId ? activeOrderForTable(selectedTableId) : undefined;

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(search.trim().toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [products, activeCategory, search]
  );

  const ticketTotal = ticket.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  const printCashierReceipt = (order: PopulatedOrder) => {
    const html = buildCashierReceiptHtml({
      atmosferaName: atmosferas.find((a) => a._id === atmosferaId)?.atmosfera ?? "",
      tableNumber: selectedTable?.stol_raqami ?? 0,
      kun: order.bron_kun ?? kun,
      oy: order.bron_oy ?? oy,
      yil: order.bron_yil ?? yil,
      soat: order.bron_soat ?? currentHour,
      davomiylikSoat: order.bron_davomiylik_soat ?? FIXED_DURATION_HOURS,
      items: order.items,
      serviceFeePercent: atmosferas.find((a) => a._id === atmosferaId)?.xizmat_haqi_foizi ?? 0,
      depositPaid: order.zalog_tolandi ?? 0,
      customerName: typeof order.user_id === "object" ? order.user_id.fullName : undefined,
      customerPhone: typeof order.user_id === "object" ? order.user_id.phone : undefined,
    });
    openPrintWindow(html, "Kassa cheki");
  };

  const addToTicket = (product: Product) => {
    setTicket((prev) => {
      const existing = prev.find((l) => l.product._id === product._id);
      if (existing) return prev.map((l) => (l.product._id === product._id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateTicketQty = (productId: string, qty: number) => {
    setTicket((prev) =>
      qty <= 0 ? prev.filter((l) => l.product._id !== productId) : prev.map((l) => (l.product._id === productId ? { ...l, qty } : l))
    );
  };

  const resetTicket = () => {
    setTicket([]);
    setSearch("");
    setActiveCategory("all");
    setError(null);
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    resetTicket();
  };

  // Bo'sh stolga yangi buyurtma (bugungi sana, joriy soat, standart 3 soat) ochadi
  const handleCreateOrder = async () => {
    if (!selectedTable || ticket.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; message?: string }>("/order", {
        items: ticket.map((l) => ({
          product_id: l.product._id,
          title: l.product.title,
          price: l.product.price,
          qty: l.qty,
        })),
        tabel_id: selectedTable._id,
        bron_kun: kun,
        bron_oy: oy,
        bron_yil: yil,
        bron_soat: currentHour,
        bron_davomiylik_soat: FIXED_DURATION_HOURS,
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      resetTicket();
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // Band stolga qo'shimcha taom qo'shadi
  const handleAddItems = async () => {
    if (!selectedTableOrder || ticket.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(`/order/${selectedTableOrder._id}/items`, {
        items: ticket.map((l) => ({
          product_id: l.product._id,
          title: l.product.title,
          price: l.product.price,
          qty: l.qty,
        })),
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      resetTicket();
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // Hisob-kitob qilingandan keyin stolni bo'shatadi va kassa chekini chop etadi
  const handleCloseBill = async () => {
    if (!selectedTableOrder) return;
    if (!confirm("Hisob-kitob qilindi va stol bo'shatilsinmi?")) return;
    setSubmitting(true);
    try {
      printCashierReceipt(selectedTableOrder);
      await api.patch(`/order/${selectedTableOrder._id}/status`, { status: "DELIVERED" });
      setSelectedTableId(null);
      resetTicket();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <UserCog className="h-6 w-6 text-teal" />
        Afitsant
      </h1>

      {loading ? (
        <Spinner />
      ) : atmosferas.length === 0 ? (
        <EmptyState icon={Armchair} title="Hozircha joy qo'shilmagan" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {atmosferas.map((a) => (
                <button
                  key={a._id}
                  onClick={() => {
                    setAtmosferaId(a._id);
                    setSelectedTableId(null);
                    resetTicket();
                  }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    atmosferaId === a._id ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
                  }`}
                >
                  {a.atmosfera}
                </button>
              ))}
            </div>

            {sortedTables.length === 0 ? (
              <EmptyState icon={Armchair} title="Bu atmosferada hali stol yo'q" />
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {sortedTables.map((t) => {
                  const occupied = !!activeOrderForTable(t._id);
                  return (
                    <button
                      key={t._id}
                      onClick={() => handleSelectTable(t._id)}
                      className={`aspect-square rounded-lg border text-sm font-semibold transition ${
                        selectedTableId === t._id
                          ? "border-teal bg-teal text-white"
                          : occupied
                          ? "border-red-200 bg-red-50 text-red-500"
                          : "border-dark/15 text-dark hover:border-teal"
                      }`}
                    >
                      {t.stol_raqami}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTable && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 rounded-full border border-dark/15 bg-white px-3 py-2 sm:w-80">
                  <Search className="h-4 w-4 text-dark/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Taom qidirish..."
                    className="w-full bg-transparent text-sm text-dark outline-none"
                  />
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      activeCategory === "all" ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
                    }`}
                  >
                    Barchasi
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setActiveCategory(c._id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        activeCategory === c._id ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addToTicket(p)}
                      className="frame flex flex-col items-start gap-1 p-3 text-left transition hover:-translate-y-0.5"
                    >
                      <span className="text-sm font-medium text-dark line-clamp-1">{p.title}</span>
                      <span className="text-xs font-semibold text-teal">{formatSom(p.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="frame h-fit p-4 sm:p-5">
            {!selectedTable ? (
              <EmptyState icon={ReceiptText} title="Stol tanlang" description="Chekni boshlash uchun avval stolni tanlang." />
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-dark">{selectedTable.stol_raqami}-stol</h2>
                  {selectedTableOrder ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">Band</span>
                  ) : (
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal">Bo&apos;sh</span>
                  )}
                </div>

                {selectedTableOrder && (
                  <div className="mb-4">
                    <Receipt
                      customerName={
                        typeof selectedTableOrder.user_id === "object" ? selectedTableOrder.user_id.fullName : undefined
                      }
                      customerPhone={
                        typeof selectedTableOrder.user_id === "object" ? selectedTableOrder.user_id.phone : undefined
                      }
                      atmosferaName={atmosferas.find((a) => a._id === atmosferaId)?.atmosfera ?? ""}
                      tableNumber={selectedTable.stol_raqami}
                      kun={selectedTableOrder.bron_kun ?? kun}
                      oy={selectedTableOrder.bron_oy ?? oy}
                      yil={selectedTableOrder.bron_yil ?? yil}
                      soat={selectedTableOrder.bron_soat ?? currentHour}
                      davomiylikSoat={selectedTableOrder.bron_davomiylik_soat ?? FIXED_DURATION_HOURS}
                      items={selectedTableOrder.items}
                      serviceFeePercent={atmosferas.find((a) => a._id === atmosferaId)?.xizmat_haqi_foizi ?? 0}
                      depositPaid={selectedTableOrder.zalog_tolandi ?? 0}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => printCashierReceipt(selectedTableOrder)}
                        className="flex items-center justify-center gap-2 rounded-full border border-dark/15 px-4 py-2.5 text-sm font-medium text-dark hover:border-teal"
                      >
                        <Printer className="h-4 w-4" />
                        Chekni chop etish
                      </button>
                      <button
                        onClick={handleCloseBill}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-teal/40 px-4 py-2.5 text-sm font-semibold text-teal hover:bg-teal/5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Hisob-kitob qilindi
                      </button>
                    </div>
                  </div>
                )}

                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-dark/50">
                  {selectedTableOrder ? "Qo'shimcha buyurtma" : "Yangi buyurtma"}
                </p>

                {ticket.length === 0 ? (
                  <p className="mb-3 text-sm text-dark/50">Chapdan taom tanlang.</p>
                ) : (
                  <div className="mb-3 flex flex-col gap-2">
                    {ticket.map((l) => (
                      <div key={l.product._id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-dark">{l.product.title}</span>
                        <button
                          onClick={() => updateTicketQty(l.product._id, l.qty - 1)}
                          className="rounded-full border border-dark/15 p-1 hover:border-teal"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold">{l.qty}</span>
                        <button
                          onClick={() => updateTicketQty(l.product._id, l.qty + 1)}
                          className="rounded-full border border-dark/15 p-1 hover:border-teal"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => updateTicketQty(l.product._id, 0)}
                          className="rounded-full p-1 text-dark/30 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-dark/10 pt-2 text-sm font-semibold text-dark">
                      <span>Qo&apos;shimcha jami</span>
                      <span>{formatSom(ticketTotal)}</span>
                    </div>
                  </div>
                )}

                {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

                <button
                  onClick={selectedTableOrder ? handleAddItems : handleCreateOrder}
                  disabled={submitting || ticket.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-dark hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
                  {selectedTableOrder ? "Chekka qo'shish" : "Buyurtma ochish"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
