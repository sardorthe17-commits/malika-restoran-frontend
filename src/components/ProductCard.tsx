"use client";

import Link from "next/link";
import { UtensilsCrossed, Plus, Minus } from "lucide-react";
import type { Product } from "@/lib/types";
import { API_URL } from "@/lib/api";
import { useCart } from "@/context/CartContext";

function resolveImage(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function ProductCard({ product }: { product: Product }) {
  const image = resolveImage(product.image_url);
  const { items, addItem, updateCount } = useCart();
  const qty = items.find((i) => i.product._id === product._id)?.count ?? 0;

  return (
    <div className="frame group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/product/${product._id}`} className="flex flex-1 flex-col">
        <div className="flex h-36 items-center justify-center overflow-hidden bg-gray/40 sm:h-40">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <UtensilsCrossed className="h-10 w-10 text-teal/40" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3 pb-0">
          <h3 className="font-display text-base font-medium text-dark line-clamp-1">{product.title}</h3>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 p-3 pt-2">
        <p className="text-sm font-semibold text-teal">
          {product.price.toLocaleString("uz-UZ")} so&apos;m
        </p>

        {qty === 0 ? (
          <button
            type="button"
            onClick={() => addItem(product)}
            aria-label="Savatga qo'shish"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive text-dark transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateCount(product._id, qty - 1)}
              aria-label="Kamaytirish"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-dark/15 text-dark transition hover:border-teal"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-4 text-center text-sm font-semibold text-dark">{qty}</span>
            <button
              type="button"
              onClick={() => updateCount(product._id, qty + 1)}
              aria-label="Ko'paytirish"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-olive text-dark transition hover:brightness-105"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
