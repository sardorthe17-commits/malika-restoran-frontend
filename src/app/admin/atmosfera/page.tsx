"use client";

import { useEffect, useState, FormEvent } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Atmosfera } from "@/lib/types";
import { formatSom } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

export default function AdminAtmosferaPage() {
  const [items, setItems] = useState<Atmosfera[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [feePercent, setFeePercent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [editFeePercent, setEditFeePercent] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Atmosfera[]>("/atmosfera");
      setItems(Array.isArray(res) ? res : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (() => {
      load();
    })();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>("/atmosfera", {
        atmosfera: name.trim(),
        zalog_summasi: deposit ? Number(deposit) : 0,
        xizmat_haqi_foizi: feePercent ? Number(feePercent) : 0,
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      setName("");
      setDeposit("");
      setFeePercent("");
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: Atmosfera) => {
    setEditingId(item._id);
    setEditName(item.atmosfera);
    setEditDeposit(item.zalog_summasi ? String(item.zalog_summasi) : "");
    setEditFeePercent(item.xizmat_haqi_foizi ? String(item.xizmat_haqi_foizi) : "");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setError(null);
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(`/atmosfera/${id}`, {
        atmosfera: editName.trim(),
        zalog_summasi: editDeposit ? Number(editDeposit) : 0,
        xizmat_haqi_foizi: editFeePercent ? Number(editFeePercent) : 0,
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/atmosfera/${id}`);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <MapPin className="h-6 w-6 text-teal" />
        Atmosfera
      </h1>

      <form onSubmit={handleCreate} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Tashqari, Ichkari, Xona, Online"
          className="flex-1 rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
        />
        <input
          type="number"
          min={0}
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          placeholder="Zalog (so'm, ixtiyoriy)"
          className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal sm:w-40"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
          placeholder="Xizmat haqi (%)"
          className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal sm:w-40"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-olive px-4 py-2.5 text-sm font-semibold text-dark transition hover:brightness-105 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Qo&apos;shish
        </button>
      </form>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState icon={MapPin} title="Hozircha hech narsa yo'q" />
      ) : (
        <div className="frame divide-y divide-dark/10">
          {items.map((item) => (
            <div key={item._id} className="flex flex-wrap items-center gap-3 p-3.5">
              {editingId === item._id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-teal px-2 py-1.5 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(e.target.value)}
                    placeholder="Zalog"
                    className="w-28 rounded-lg border border-teal px-2 py-1.5 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editFeePercent}
                    onChange={(e) => setEditFeePercent(e.target.value)}
                    placeholder="Xizmat haqi %"
                    className="w-28 rounded-lg border border-teal px-2 py-1.5 text-sm outline-none"
                  />
                  <button
                    onClick={() => saveEdit(item._id)}
                    className="rounded-full p-1.5 text-teal hover:bg-teal/10"
                    aria-label="Saqlash"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-full p-1.5 text-dark/40 hover:bg-dark/5"
                    aria-label="Bekor qilish"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm text-dark">{item.atmosfera}</span>
                    {!!item.zalog_summasi && (
                      <span className="ml-2 text-xs text-dark/50">Zalog: {formatSom(item.zalog_summasi)}</span>
                    )}
                    {!!item.xizmat_haqi_foizi && (
                      <span className="ml-2 text-xs text-dark/50">Xizmat haqi: {item.xizmat_haqi_foizi}%</span>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-full p-1.5 text-dark/40 hover:bg-teal/10 hover:text-teal"
                    aria-label="Tahrirlash"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    className="rounded-full p-1.5 text-dark/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="O'chirish"
                  >
                    {deletingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
