"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import type { Product } from "@/lib/types";

const STORAGE_KEY = "malika:cart";

export interface CartItem {
  product: Product;
  count: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, count?: number) => void;
  updateCount: (productId: string, count: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
  totalCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {
        /* noop */
      }
    })();
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }, []);

  const addItem = useCallback(
    (product: Product, count = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product._id === product._id);
        const next = existing
          ? prev.map((i) => (i.product._id === product._id ? { ...i, count: i.count + count } : i))
          : [...prev, { product, count }];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    []
  );

  const updateCount = useCallback(
    (productId: string, count: number) => {
      setItems((prev) => {
        const next =
          count <= 0
            ? prev.filter((i) => i.product._id !== productId)
            : prev.map((i) => (i.product._id === productId ? { ...i, count } : i));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product._id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => persist([]), [persist]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.product.price * i.count, 0), [items]);
  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.count, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateCount, removeItem, clear, total, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart CartProvider ichida ishlatilishi kerak");
  return ctx;
}
