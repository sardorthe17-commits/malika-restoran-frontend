"use client";

import { useEffect, useState } from "react";
import { Users, Search, Trash2, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const query = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await api.get<User[]>(`/user${query}`);
      setUsers(Array.isArray(res) ? res : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const toggleRole = async (u: User) => {
    setBusyId(u._id);
    try {
      const nextRole = u.role === "ADMIN" ? "CLIENT" : "ADMIN";
      await api.patch(`/user/${u._id}`, { role: nextRole });
      await load(search);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`${u.fullName}ni rostdan ham o'chirmoqchimisiz?`)) return;
    setBusyId(u._id);
    try {
      await api.delete(`/user/${u._id}`);
      await load(search);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <Users className="h-6 w-6 text-teal" />
        Foydalanuvchilar
      </h1>

      <div className="mb-5 flex items-center gap-2 rounded-full border border-dark/15 bg-white px-3 py-2 sm:w-80">
        <Search className="h-4 w-4 text-dark/40" aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full bg-transparent text-sm text-dark outline-none"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Foydalanuvchi topilmadi" />
      ) : (
        <div className="frame divide-y divide-dark/10">
          {users.map((u) => (
            <div key={u._id} className="flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-dark">{u.fullName}</p>
                <p className="text-xs text-dark/50">{u.phone}</p>
              </div>

              <button
                onClick={() => toggleRole(u)}
                disabled={busyId === u._id || u._id === me?._id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                  u.role === "ADMIN" ? "border-olive bg-olive/10 text-olive" : "border-dark/15 text-dark/60 hover:border-teal"
                }`}
                title={u._id === me?._id ? "O'zingizning rolingizni o'zgartira olmaysiz" : undefined}
              >
                {u.role === "ADMIN" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                {u.role === "ADMIN" ? "Admin" : "Mijoz"}
              </button>

              <button
                onClick={() => handleDelete(u)}
                disabled={busyId === u._id || u._id === me?._id}
                className="rounded-full p-1.5 text-dark/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                aria-label="O'chirish"
                title={u._id === me?._id ? "O'zingizni o'chira olmaysiz" : "O'chirish"}
              >
                {busyId === u._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
