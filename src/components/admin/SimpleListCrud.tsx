"use client";

import { useEffect, useState, FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

interface Item {
  _id: string;
  [key: string]: unknown;
}

interface SimpleListCrudProps {
  title: string;
  icon: LucideIcon;
  fieldKey: string; // masalan "name" yoki "atmosfera"
  fieldLabel: string; // masalan "Kategoriya nomi"
  listPath: string; // GET manzili
  createPath: string; // POST manzili
  updatePath: (id: string) => string; // PATCH manzili
  deletePath: (id: string) => string; // DELETE manzili
  placeholder?: string;
}

export function SimpleListCrud({
  title,
  icon: Icon,
  fieldKey,
  fieldLabel,
  listPath,
  createPath,
  updatePath,
  deletePath,
  placeholder,
}: SimpleListCrudProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Item[]>(listPath);
      setItems(Array.isArray(res) ? res : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>(createPath, {
        [fieldKey]: newValue.trim(),
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      setNewValue("");
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item._id);
    setEditValue(String(item[fieldKey] ?? ""));
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    setError(null);
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(updatePath(id), {
        [fieldKey]: editValue.trim(),
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
      await api.delete(deletePath(id));
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <Icon className="h-6 w-6 text-teal" />
        {title}
      </h1>

      <form onSubmit={handleCreate} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder ?? fieldLabel}
          className="flex-1 rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
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
        <EmptyState icon={Icon} title="Hozircha hech narsa yo'q" />
      ) : (
        <div className="frame divide-y divide-dark/10">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-3.5">
              {editingId === item._id ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-teal px-2 py-1.5 text-sm outline-none"
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
                  <span className="flex-1 text-sm text-dark">{String(item[fieldKey] ?? "")}</span>
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
