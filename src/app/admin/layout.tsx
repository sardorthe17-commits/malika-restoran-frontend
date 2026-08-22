"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ClipboardCheck,
  UtensilsCrossed,
  Tag,
  MapPin,
  Armchair,
  Map as MapIcon,
  MessageCircle,
  Menu as MenuIcon,
  X,
  ArrowLeft,
  LogOut,
  UserCog,
  ChefHat,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/Spinner";

const LINKS = [
  { href: "/admin", label: "Bosh sahifa", icon: LayoutDashboard, exact: true },
  { href: "/admin/bron", label: "Bron so'rovlari", icon: ClipboardCheck },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ClipboardList },
  { href: "/admin/afitsant", label: "Afitsant", icon: UserCog },
  { href: "/admin/oshxona", label: "Oshxona", icon: ChefHat },
  { href: "/admin/products", label: "Mahsulotlar", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Kategoriyalar", icon: Tag },
  { href: "/admin/atmosfera", label: "Atmosfera", icon: MapPin },
  { href: "/admin/tables", label: "Stollar", icon: Armchair },
  { href: "/admin/places", label: "Joylar", icon: MapIcon },
  { href: "/admin/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <Spinner label="Tekshirilmoqda..." />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
        <p className="font-display text-xl font-semibold text-dark">Bu bo&apos;lim faqat adminlar uchun</p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-dark hover:brightness-105"
        >
          <ArrowLeft className="h-4 w-4" />
          Menyuga qaytish
        </button>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-dvh bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-teal/20 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-teal/10 px-5">
          <span className="font-display text-lg font-semibold text-dark">Malika · Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {LINKS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(href, exact) ? "bg-teal text-white" : "text-dark/70 hover:bg-teal/10"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-teal/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-dark/70 hover:bg-teal/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Saytga qaytish
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-dark/70 hover:bg-teal/10"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex flex-1 flex-col md:hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-teal/20 bg-white px-4">
          <span className="font-display text-base font-semibold text-dark">Malika · Admin</span>
          <button onClick={() => setOpen(true)} aria-label="Menyuni ochish" className="rounded-full p-2 hover:bg-teal/10">
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-72 max-w-[80%] flex-col bg-white p-3">
              <div className="mb-2 flex items-center justify-between px-2 py-2">
                <span className="font-display text-base font-semibold text-dark">Malika · Admin</span>
                <button onClick={() => setOpen(false)} aria-label="Yopish" className="rounded-full p-2 hover:bg-teal/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {LINKS.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive(href, exact) ? "bg-teal text-white" : "text-dark/70 hover:bg-teal/10"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                ))}
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-dark/70 hover:bg-teal/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Saytga qaytish
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-dark/70 hover:bg-teal/10"
                >
                  <LogOut className="h-4 w-4" />
                  Chiqish
                </button>
              </nav>
            </div>
            <div className="flex-1 bg-dark/40" onClick={() => setOpen(false)} />
          </div>
        )}

        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Desktop content */}
      <main className="hidden flex-1 p-6 md:block lg:p-8">{children}</main>
    </div>
  );
}
