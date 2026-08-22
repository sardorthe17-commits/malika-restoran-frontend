"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Phone, Lock, Cake, UserPlus, ShieldCheck, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BackButton } from "@/components/BackButton";

const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const { register, sendOtp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const phoneValid = phone.length === 9;

  const handleSendOtp = async () => {
    if (!phoneValid || sendingOtp || cooldown > 0) return;
    setOtpError(null);
    setSendingOtp(true);
    try {
      const res = await sendOtp(phone);
      if (!res.success) {
        setOtpError(res.message ?? "Kod yuborishda xatolik yuz berdi");
        return;
      }
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setOtpError("Server bilan bog'lanishda xatolik");
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({ fullName, age: Number(age), phone, password, otp_code: otpCode });
      if (!res.success) {
        setError(res.message ?? "Ro'yxatdan o'tishda xatolik yuz berdi");
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
        <h1 className="mb-1 text-2xl font-semibold text-dark">Ro&apos;yxatdan o&apos;tish</h1>
        <p className="mb-6 text-sm text-dark/60">Buyurtma berish uchun hisob yarating</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark">
            Ism familiya
            <div className="flex items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
              <User className="h-4 w-4 text-teal" aria-hidden="true" />
              <input
                required
                minLength={4}
                placeholder="Aziza Karimova"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent text-dark outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark">
            Yosh
            <div className="flex items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
              <Cake className="h-4 w-4 text-teal" aria-hidden="true" />
              <input
                required
                type="number"
                min={17}
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-transparent text-dark outline-none"
              />
            </div>
          </label>

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
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setOtpSent(false);
                  setOtpCode("");
                }}
                className="w-full bg-transparent text-dark outline-none"
              />
            </div>
          </label>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
                <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
                <input
                  required
                  inputMode="numeric"
                  minLength={6}
                  maxLength={6}
                  placeholder="SMS kodi"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent text-dark outline-none"
                />
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!phoneValid || sendingOtp || cooldown > 0}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-teal/40 px-3 py-2.5 text-xs font-medium text-teal hover:bg-teal/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingOtp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {cooldown > 0 ? `${cooldown}s` : otpSent ? "Qayta yuborish" : "Kod yuborish"}
              </button>
            </div>
            {otpSent && !otpError && (
              <p className="text-xs text-teal">Kod +998{phone} raqamiga yuborildi.</p>
            )}
            {otpError && <p className="text-xs text-red-600">{otpError}</p>}
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark">
            Parol
            <div className="flex items-center gap-2 rounded-lg border border-dark/15 px-3 py-2.5 focus-within:border-teal">
              <Lock className="h-4 w-4 text-teal" aria-hidden="true" />
              <input
                required
                type="password"
                minLength={8}
                placeholder="Kamida 8 ta belgi"
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
            disabled={loading || otpCode.length !== 6}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-dark transition hover:brightness-105 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-dark/60">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-teal hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
