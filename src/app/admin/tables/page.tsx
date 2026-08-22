"use client";

import { useEffect, useMemo, useState } from "react";
import { Armchair, Loader2, Trash2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Atmosfera, Tabel } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

export default function AdminTablesPage() {
  const [atmosferas, setAtmosferas] = useState<Atmosfera[]>([]);
  const [tables, setTables] = useState<Tabel[]>([]);
  const [loading, setLoading] = useState(true);

  const [atmosferaId, setAtmosferaId] = useState("");
  const [count, setCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [atms, tabs] = await Promise.all([
        api.get<Atmosfera[]>("/atmosfera"),
        api.get<Tabel[]>("/tabel"),
      ]);
      setAtmosferas(Array.isArray(atms) ? atms : []);
      setTables(Array.isArray(tabs) ? tabs : []);
      if (!atmosferaId && Array.isArray(atms)) {
        const firstSelectable = atms.find((a) => a.atmosfera.trim().toLowerCase() !== "online");
        if (firstSelectable) setAtmosferaId(firstSelectable._id);
      }
    } catch {
      setAtmosferas([]);
      setTables([]);
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

  const filteredTables = useMemo(
    () =>
      tables
        .filter((t) => {
          const tId = typeof t.atmosfera_id === "string" ? t.atmosfera_id : t.atmosfera_id?._id;
          return tId === atmosferaId;
        })
        .sort((a, b) => a.stol_raqami - b.stol_raqami),
    [tables, atmosferaId]
  );

  const handleGenerate = async () => {
    setError(null);
    if (!atmosferaId) {
      setError("Avval atmosfera tanlang");
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>("/tabel/bulk", {
        atmosfera_id: atmosferaId,
        count,
      });
      if (!res.success) {
        setError(res.message ?? "Xatolik yuz berdi");
        return;
      }
      await load();
    } catch {
      setError("Stollar yaratishda xatolik yuz berdi.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/tabel/${id}`);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <Armchair className="h-6 w-6 text-teal" />
        Stollar
      </h1>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="frame mb-6 p-4 sm:p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-dark">Yangi stollar qo&apos;shish</h2>
            <p className="mb-3 text-xs text-dark/50">
              Masalan: agar restoranning tashqarisida jami 6 ta stol bo&apos;lsa, &quot;Tashqari&quot;
              atmosferasini tanlab, sonini 6 deb kiriting. Bu stollar doimiy bo&apos;ladi — mijozlar keyin
              ularni turli kun/soatlarga bron qilishadi.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={atmosferaId}
                onChange={(e) => setAtmosferaId(e.target.value)}
                className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
              >
                <option value="">Atmosfera tanlang</option>
                {atmosferas
                  .filter((a) => a.atmosfera.trim().toLowerCase() !== "online")
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.atmosfera}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                placeholder="Stollar soni"
                className="rounded-lg border border-dark/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center justify-center gap-2 rounded-lg bg-olive px-4 py-2.5 text-sm font-semibold text-dark hover:brightness-105 disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {count} ta stol qo&apos;shish
              </button>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>

          <h2 className="mb-3 font-display text-base font-semibold text-dark">
            {atmosferas.find((a) => a._id === atmosferaId)?.atmosfera ?? ""} stollari ({filteredTables.length})
          </h2>

          {filteredTables.length === 0 ? (
            <EmptyState icon={Armchair} title="Bu atmosferada hali stol yo'q" />
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {filteredTables.map((t) => (
                <div key={t._id} className="group relative aspect-square rounded-lg border border-dark/15 bg-white">
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-dark">
                    {t.stol_raqami}
                  </span>
                  <button
                    onClick={() => handleDelete(t._id)}
                    disabled={deletingId === t._id}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-1 text-red-500 opacity-0 shadow ring-1 ring-red-200 transition group-hover:opacity-100"
                    aria-label="O'chirish"
                  >
                    {deletingId === t._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
