"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu as MenuIcon,
  X,
  UtensilsCrossed,
  Armchair,
  ClipboardList,
  ShieldCheck,
  LogIn,
  LogOut,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/", label: "Menyu", icon: UtensilsCrossed },
  { href: "/my-table", label: "Meni stolim", icon: Armchair },
  { href: "/my-orders", label: "Buyurtmam", icon: ClipboardList },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalCount } = useCart();

  // Admin panelida alohida layout/sidebar bo'lgani uchun umumiy navbar'ni yashiramiz
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-teal/30 bg-teal text-white shadow-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide">
          Malika Restoran
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/15 ${
                pathname === href ? "bg-white/20" : ""
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          ))}

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/15"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Savat
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-bold text-dark">
                {totalCount}
              </span>
            )}
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-olive px-3 py-2 text-sm font-semibold text-dark transition hover:brightness-105"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Admin panel
            </Link>
          )}

          {user ? (
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-2 text-sm font-medium transition hover:bg-white/15"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Chiqish
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-2 flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-2 text-sm font-medium transition hover:bg-white/15"
            >
              <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Kirish
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center justify-center rounded-full p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/20 bg-teal px-4 py-3 md:hidden">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === href ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          ))}

          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Savat{totalCount > 0 ? ` (${totalCount})` : ""}
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-olive px-3 py-2.5 text-sm font-semibold text-dark"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Admin panel
            </Link>
          )}

          {user ? (
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Chiqish
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Kirish
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
