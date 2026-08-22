"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BackButton } from "@/components/BackButton";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(phone, password);
      if (!res.success) {
        setError(res.message ?? "Kirishda xatolik yuz berdi");
        return;
      }
      router.push("/");
    } catch {
      setError("Server bilan bog'lanishda xatolik. Birozdan so'ng qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      <div className="frame p-6 sm:p-8">
        <h1 className="mb-1 text-2xl font-semibold text-dark">Tizimga kirish</h1>
        <p className="mb-6 text-sm text-dark/60">Telefon raqamingiz va parolingizni kiriting</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark">
            Telefon raqam
            <div className="flex items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
              <Phone className="h-4 w-4 text-teal" aria-hidden="true" />
              <span className="text-dark/50">+998</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                minLength={9}
                maxLength={9}
                placeholder="901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent text-dark outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark">
            Parol
            <div className="flex items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
              <Lock className="h-4 w-4 text-teal" aria-hidden="true" />
              <input
                required
                type="password"
                minLength={8}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-dark outline-none"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-dark transition hover:brightness-105 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {loading ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-dark/60">
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/register" className="font-medium text-teal hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>
    </div>
  );
}
