"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { UtensilsCrossed, Plus, Pencil, Trash2, Loader2, X, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { formatSom } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface FormState {
  title: string;
  price: string;
  category_id: string;
  discriptions: string;
  image_url: string;
}

const EMPTY_FORM: FormState = { title: "", price: "", category_id: "", discriptions: "", image_url: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.get<Product[]>("/product"),
        api.get<Category[]>("/category/all"),
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setForm({
      title: p.title,
      price: String(p.price),
      category_id: p.category_id,
      discriptions: p.discriptions ?? "",
      image_url: p.image_url ?? "",
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.price || !form.category_id) {
      setError("Nomi, narxi va kategoriyasi to'ldirilishi shart");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        category_id: form.category_id,
        discriptions: form.discriptions.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
      };

      const res = editingId
        ? await api.patch<{ success: boolean; message?: string }>(`/product/${editingId}`, payload)
        : await api.post<{ success: boolean; message?: string }>("/product", payload);

      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      resetForm();
      await load();
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/product/${id}`);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const categoryName = (id: string) => categories.find((c) => c._id === id)?.name ?? "—";

  const filteredProducts = useMemo(
    () => products.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase())),
    [products, search]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-dark">
          <UtensilsCrossed className="h-6 w-6 text-teal" />
          Mahsulotlar
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-2 rounded-lg bg-olive px-4 py-2.5 text-sm font-semibold text-dark hover:brightness-105"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Yopish" : "Yangi mahsulot"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="frame mb-6 flex flex-col gap-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Taom nomi"
              className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Narxi (so'm)"
              className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            >
              <option value="">Kategoriya tanlang</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />

          <textarea
            value={form.discriptions}
            onChange={(e) => setForm((f) => ({ ...f, discriptions: e.target.value }))}
            placeholder="Tavsif (ixtiyoriy)"
            rows={2}
            className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-fit items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? "Saqlash" : "Qo'shish"}
          </button>
        </form>
      )}

      <div className="mb-5 flex items-center gap-2 rounded-full border border-dark/15 bg-white px-3 py-2 sm:w-80">
        <Search className="h-4 w-4 text-dark/40" aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulot nomi bo'yicha qidirish..."
          className="w-full bg-transparent text-sm text-dark outline-none"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filteredProducts.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title={search ? "Hech narsa topilmadi" : "Hozircha mahsulot yo'q"} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <div key={p._id} className="frame flex flex-col gap-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-dark">{p.title}</p>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-full p-1.5 text-dark/40 hover:bg-teal/10 hover:text-teal"
                    aria-label="Tahrirlash"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={deletingId === p._id}
                    className="rounded-full p-1.5 text-dark/40 hover:bg-red-50 hover:text-red-600"
                    aria-label="O'chirish"
                  >
                    {deletingId === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-dark/50">{categoryName(p.category_id)}</p>
              <p className="text-sm font-semibold text-teal">{formatSom(p.price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
