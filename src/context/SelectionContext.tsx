"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Atmosfera, Tabel, Order } from "@/lib/types";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toDateParts } from "@/lib/utils";

const STORAGE_KEY = "malika:selection";

export interface DiningSelection {
  atmosfera: Atmosfera;
  tabel: Tabel | null; // "Online" tanlansa stol kerak emas — null bo'ladi
  isoDate: string; // "2026-08-01"
  soat: number | null; // stol qaysi soatdan band qilinmoqda (0-23)
  davomiylikSoat: number | null; // necha soat o'tirishadi
}

interface SelectionContextValue {
  selection: DiningSelection | null;
  setSelection: (s: DiningSelection) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<DiningSelection | null>(null);

  useEffect(() => {
    (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSelectionState(JSON.parse(raw));
      } catch {
        // localStorage mavjud bo'lmasligi mumkin — jim o'tamiz
      }
    })();
  }, []);

  const setSelection = useCallback((s: DiningSelection) => {
    setSelectionState(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* noop */
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  // Mijoz stolda o'tirib ovqatlanib bo'lgach (admin hisobni yopib, buyurtmani
  // "Yakunlandi"ga o'tkazgach) yoki bron bekor/rad etilgach — "Meni stolim"
  // avtomatik bo'shashi (tanlov tozalanishi) kerak, chunki mijoz allaqachon
  // ketgan bo'ladi.
  const checkIfFinished = useCallback(
    async (current: DiningSelection) => {
      if (!current.tabel) return;
      try {
        const orders = await api.get<Order[]>("/order/mine");
        if (!Array.isArray(orders)) return;
        const { kun, oy, yil } = toDateParts(current.isoDate);
        const related = orders.filter((o) => {
          const tId = typeof o.tabel_id === "string" ? o.tabel_id : (o.tabel_id as { _id?: string } | undefined)?._id;
          return tId === current.tabel!._id && o.bron_kun === kun && o.bron_oy === oy && o.bron_yil === yil;
        });
        if (related.length === 0) return;
        const anyFinished = related.some((o) => o.status === "DELIVERED");
        const allCancelled = related.every((o) => o.status === "CANCELLED");
        if (anyFinished || allCancelled) clearSelection();
      } catch {
        /* tarmoq xatosi bo'lsa, tanlovni o'zgartirmaymiz */
      }
    },
    [clearSelection]
  );

  useEffect(() => {
    if (!selection) return;
    (() => {
      checkIfFinished(selection);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.tabel?._id, selection?.isoDate]);

  useEffect(() => {
    if (!selection?.tabel) return;
    const socket = getSocket();
    const onChanged = () => checkIfFinished(selection);
    socket.on("order-status-changed", onChanged);
    socket.on("order-cancelled", onChanged);
    socket.on("reservation-decided", onChanged);
    return () => {
      socket.off("order-status-changed", onChanged);
      socket.off("order-cancelled", onChanged);
      socket.off("reservation-decided", onChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.tabel?._id]);

  return (
    <SelectionContext.Provider value={{ selection, setSelection, clearSelection }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection SelectionProvider ichida ishlatilishi kerak");
  return ctx;
}
