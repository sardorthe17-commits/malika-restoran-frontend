"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, MapPin, LocateFixed, Send, Bookmark, PlusCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSelection } from "@/context/SelectionContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatSom, toDateParts } from "@/lib/utils";
import type { SavedAddress } from "@/lib/types";
import { BackButton } from "@/components/BackButton";
import { EmptyState } from "@/components/EmptyState";

function isOnline(name: string) {
  return name.trim().toLowerCase() === "online";
}

export default function CartPage() {
  const { items, updateCount, removeItem, total, clear } = useCart();
  const { selection } = useSelection();
  const { user } = useAuth();
  const router = useRouter();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);

  const [label, setLabel] = useState("Uy");
  const [addressText, setAddressText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsAddress = selection ? isOnline(selection.atmosfera.atmosfera) : false;

  useEffect(() => {
    if (!user || !needsAddress) return;
    (async () => {
      try {
        const res = await api.get<SavedAddress[]>("/address");
        const list = Array.isArray(res) ? res : [];
        setSavedAddresses(list);
        setSelectedAddressId(list.length > 0 ? list[0]._id : "new");
      } catch {
        setSavedAddresses([]);
        setSelectedAddressId("new");
      }
    })();
  }, [user, needsAddress]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Brauzeringiz joylashuvni aniqlashni qo'llamaydi. Manzilni qo'lda kiriting.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Joylashuvni aniqlab bo'lmadi. Ruxsat berilganini tekshiring.");
        setLocating(false);
      }
    );
  };

  const handleCheckout = async () => {
    setError(null);

    if (!user) {
      router.push("/login");
      return;
    }
    if (!selection) {
      setError("Avval menyu sahifasida joyingizni (atmosfera/stol) tanlang.");
      return;
    }

    const usingSaved = needsAddress && selectedAddressId && selectedAddressId !== "new";
    const savedAddress = usingSaved ? savedAddresses.find((a) => a._id === selectedAddressId) : null;

    if (needsAddress && !usingSaved && (!addressText || lat === null || lng === null)) {
      setError("Yetkazib berish uchun manzil va joylashuvni to'ldiring.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({
          product_id: i.product._id,
          title: i.product.title,
          price: i.product.price,
          qty: i.count,
        })),
      };

      if (needsAddress) {
        payload.address = savedAddress
          ? { label: savedAddress.label, address_text: savedAddress.address_text, lat: savedAddress.lat, lng: savedAddress.lng }
          : { label, address_text: addressText, lat, lng };
      } else if (selection.tabel) {
        payload.tabel_id = selection.tabel._id;
        const { kun, oy, yil } = toDateParts(selection.isoDate);
        payload.bron_kun = kun;
        payload.bron_oy = oy;
        payload.bron_yil = yil;
        payload.bron_soat = selection.soat;
        payload.bron_davomiylik_soat = selection.davomiylikSoat;
      }

      const res = await api.post<{ success: boolean; message?: string }>("/order", payload);
      if (!res.success) {
        setError(res.message ?? "Buyurtma berishda xatolik yuz berdi");
        return;
      }

      // Yangi manzil bo'lsa va "saqlash" belgilangan bo'lsa, keyingi safar uchun saqlab qo'yamiz
      if (needsAddress && !usingSaved && saveNewAddress) {
        await api.post("/address", { label, address_text: addressText, lat, lng }).catch(() => null);
      }

      clear();
      router.push("/my-orders");
    } catch {
      setError("Server bilan bog'lanishda xatolik. Birozdan so'ng qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      <h1 className="mb-5 font-display text-2xl font-semibold text-dark">Savat</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Savatingiz bo'sh"
          description="Menyudan taom tanlab, savatga qo'shing."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="frame divide-y divide-dark/10">
            {items.map((i) => (
              <div key={i.product._id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-dark">{i.product.title}</p>
                  <p className="text-sm text-teal">{formatSom(i.product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCount(i.product._id, i.count - 1)}
                    className="rounded-full border border-dark/15 p-1.5 hover:border-teal"
                    aria-label="Kamaytirish"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{i.count}</span>
                  <button
                    onClick={() => updateCount(i.product._id, i.count + 1)}
                    className="rounded-full border border-dark/15 p-1.5 hover:border-teal"
                    aria-label="Ko'paytirish"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(i.product._id)}
                  className="rounded-full p-1.5 text-dark/40 hover:bg-red-50 hover:text-red-600"
                  aria-label="O'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {!selection && (
            <p className="rounded-lg bg-olive/10 px-3 py-2 text-sm text-dark/70">
              Buyurtma berishdan oldin{" "}
              <button onClick={() => router.push("/")} className="font-medium text-teal hover:underline">
                menyu sahifasida joyingizni tanlang
              </button>
              .
            </p>
          )}

          {selection && needsAddress && (
            <div className="frame p-4 sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-dark">
                <MapPin className="h-4 w-4 text-teal" />
                Yetkazib berish manzili
              </h2>

              {savedAddresses.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => setSelectedAddressId(a._id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedAddressId === a._id ? "border-teal bg-teal/5" : "border-dark/15 hover:border-teal"
                      }`}
                    >
                      <Bookmark className="h-4 w-4 shrink-0 text-teal" />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-dark">{a.label}</span>
                        <span className="block truncate text-xs text-dark/50">{a.address_text}</span>
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedAddressId("new")}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedAddressId === "new" ? "border-teal bg-teal/5" : "border-dark/15 hover:border-teal"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 shrink-0 text-teal" />
                    Yangi manzil kiritish
                  </button>
                </div>
              )}

              {selectedAddressId === "new" && (
                <div className="flex flex-col gap-3">
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Manzil nomi (masalan: Uy, Ish)"
                    className="rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                  <textarea
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="To'liq manzil (ko'cha, uy raqami...)"
                    rows={2}
                    className="rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="flex w-fit items-center gap-2 rounded-full border border-teal/40 px-3 py-2 text-xs font-medium text-teal hover:bg-teal/5 disabled:opacity-60"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    {locating ? "Aniqlanmoqda..." : lat !== null ? "Joylashuv aniqlandi ✓" : "Joylashuvni aniqlash"}
                  </button>
                  <label className="flex items-center gap-2 text-xs text-dark/60">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="h-3.5 w-3.5 accent-teal"
                    />
                    Keyingi safar uchun saqlab qo&apos;yish
                  </label>
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="frame flex items-center justify-between p-4">
            <span className="text-sm text-dark/60">Jami</span>
            <span className="font-display text-xl font-semibold text-dark">{formatSom(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-dark transition hover:brightness-105 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Yuborilmoqda..." : "Buyurtma berish"}
          </button>
        </div>
      )}
    </div>
  );
}
