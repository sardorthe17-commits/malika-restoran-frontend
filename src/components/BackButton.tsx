"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  /** Agar berilsa, shu manzilga qaytadi; aks holda brauzer tarixida orqaga qaytadi */
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Orqaga", className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href);
    else router.back();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition hover:border-teal hover:bg-teal/5 active:scale-95 sm:px-4 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0 text-teal" strokeWidth={2.25} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
