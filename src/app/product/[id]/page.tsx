"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, Check } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import type { Product, ApiResponse } from "@/lib/types";
import { BackButton } from "@/components/BackButton";
import { ProductCard } from "@/components/ProductCard";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { formatSom } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

function resolveImage(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ProductInfoPage() {
  const params = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get<Product | ApiResponse<Product>>(`/product/${params.id}`);
        const item = (res as ApiResponse<Product>)?.data ?? (res as Product);
        if (!item?._id) {
          setNotFound(true);
          return;
        }
        setProduct(item);

        const all = await api.get<Product[]>("/product");
        setRelated(
          Array.isArray(all)
            ? all.filter((p) => p.category_id === item.category_id && p._id !== item._id)
            : []
        );
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      {loading ? (
        <Spinner label="Yuklanmoqda..." />
      ) : notFound || !product ? (
        <EmptyState icon={UtensilsCrossed} title="Taom topilmadi" description="Bu taom o'chirilgan yoki mavjud emas." />
      ) : (
        <>
          <div className="frame overflow-hidden">
            <div className="flex h-56 items-center justify-center bg-gray/40 sm:h-72">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImage(product.image_url) ?? undefined}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="h-16 w-16 text-teal/40" strokeWidth={1.5} aria-hidden="true" />
              )}
            </div>
            <div className="p-5 sm:p-6">
              <h1 className="font-display text-2xl font-semibold text-dark">{product.title}</h1>
              {product.discriptions && (
                <p className="mt-2 text-sm leading-relaxed text-dark/70">{product.discriptions}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-semibold text-teal">{formatSom(product.price)}</span>
                <button
                  onClick={() => {
                    addItem(product);
                    setAdded(true);
                    setTimeout(() => setAdded(false), 1500);
                  }}
                  className="flex items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-dark transition hover:brightness-105"
                >
                  {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
                  {added ? "Qo'shildi" : "Buyurtmaga qo'shish"}
                </button>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold text-dark">Shu turkumdan yana</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
