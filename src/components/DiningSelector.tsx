"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, MapPin, Armchair, Truck, Clock, Hourglass } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toDateParts } from "@/lib/utils";
import { useSelection } from "@/context/SelectionContext";
import type { Atmosfera, Tabel } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isOnline(a: Atmosfera) {
  return a.atmosfera.trim().toLowerCase() === "online";
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 08:00 - 23:00
// Restoran siyosatiga ko'ra stolda o'tirish vaqti standart 3 soat qilib belgilangan.
const FIXED_DURATION_HOURS = 3;

export function DiningSelector() {
  const { selection, setSelection, clearSelection } = useSelection();

  const [atmosferas, setAtmosferas] = useState<Atmosfera[]>([]);
  const [tables, setTables] = useState<Tabel[]>([]);
  const [loadingAtmosferas, setLoadingAtmosferas] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);

  const [chosenAtmosfera, setChosenAtmosfera] = useState<Atmosfera | null>(selection?.atmosfera ?? null);
  const [isoDate, setIsoDate] = useState(selection?.isoDate ?? todayIso());
  const [soat, setSoat] = useState<number | null>(selection?.soat ?? null);
  const [davomiylik] = useState<number | null>(selection?.davomiylikSoat ?? FIXED_DURATION_HOURS);
  const [chosenTabel, setChosenTabel] = useState<Tabel | null>(selection?.tabel ?? null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Atmosfera[]>("/atmosfera");
        setAtmosferas(Array.isArray(res) ? res : []);
      } catch {
        setAtmosferas([]);
      } finally {
        setLoadingAtmosferas(false);
      }
    })();
  }, []);

  const { kun, oy, yil } = useMemo(() => toDateParts(isoDate), [isoDate]);

  const fetchTables = async (atmosfera: Atmosfera, k: number, o: string, y: number) => {
    if (isOnline(atmosfera)) return;
    setLoadingTables(true);
    try {
      const params = new URLSearchParams({
        atmosfera_id: atmosfera._id,
        kun: String(k),
        oy: o,
        yil: String(y),
      });
      const res = await api.get<Tabel[]>(`/tabel?${params.toString()}`);
      setTables(Array.isArray(res) ? res : []);
    } catch {
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  // Atmosfera yoki sana o'zgarganda — SHU KUNGA tegishli barcha stollarning
  // to'liq band jadvalini (bookings) olib kelamiz. Shundan keyin soat/davomiylik
  // o'zgarganda qayta so'rov yubormasdan, mahalliy (client) tarafda hisoblaymiz —
  // mijoz darhol qaysi stol qachon bandligini ko'radi.
  useEffect(() => {
    if (!chosenAtmosfera) return;
    (() => {
      fetchTables(chosenAtmosfera, kun, oy, yil);
    })();
     
  }, [chosenAtmosfera, kun, oy, yil]);

  // Boshqa mijoz stol band qilsa, admin hisobni yopib stolni bo'shatsa yoki
  // bronni tasdiqlasa/rad etsa — ro'yxat real-vaqtda yangilanishi kerak.
  // Aks holda foydalanuvchi eskirgan ("band") ma'lumotni ko'rib, aslida
  // bo'shagan stolni tanlay olmay qoladi.
  useEffect(() => {
    if (!chosenAtmosfera || isOnline(chosenAtmosfera)) return;
    const socket = getSocket();
    const refresh = () => fetchTables(chosenAtmosfera, kun, oy, yil);
    socket.on("new-order", refresh);
    socket.on("new-reservation-request", refresh);
    socket.on("reservation-decided", refresh);
    socket.on("order-status-changed", refresh);
    socket.on("order-cancelled", refresh);
    return () => {
      socket.off("new-order", refresh);
      socket.off("new-reservation-request", refresh);
      socket.off("reservation-decided", refresh);
      socket.off("order-status-changed", refresh);
      socket.off("order-cancelled", refresh);
    };
     
  }, [chosenAtmosfera, kun, oy, yil]);

  const sortedTables = useMemo(() => [...tables].sort((a, b) => a.stol_raqami - b.stol_raqami), [tables]);

  const isBusyAtChosenTime = (t: Tabel) => {
    if (soat == null || davomiylik == null) return false;
    const newEnd = soat + davomiylik;
    return (t.bookings ?? []).some((b) => overlaps(soat, newEnd, b.soat, b.soat + b.davomiylik_soat));
  };

  const confirmed = !!selection;

  if (confirmed && selection) {
    return (
      <div className="frame mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm text-dark">
          <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
          <span>
            <strong className="font-semibold">{selection.atmosfera.atmosfera}</strong>
            {selection.tabel && (
              <>
                {" "}
                — {selection.tabel.stol_raqami}-stol, {selection.isoDate} soat {selection.soat}:00 dan{" "}
                {selection.davomiylikSoat} soatga
              </>
            )}
          </span>
        </div>
        <button
          onClick={clearSelection}
          className="rounded-full border border-teal/40 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5"
        >
          O&apos;zgartirish
        </button>
      </div>
    );
  }

  return (
    <div className="frame mb-6 p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-dark">
        <MapPin className="h-5 w-5 text-teal" aria-hidden="true" />
        Avval joyingizni tanlang
      </h2>

      {loadingAtmosferas ? (
        <Spinner label="Joylar yuklanmoqda..." />
      ) : atmosferas.length === 0 ? (
        <EmptyState icon={MapPin} title="Hozircha joylar mavjud emas" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {atmosferas.map((a) => (
              <button
                key={a._id}
                onClick={() => {
                  setChosenAtmosfera(a);
                  setChosenTabel(null);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  chosenAtmosfera?._id === a._id
                    ? "border-teal bg-teal text-white"
                    : "border-dark/15 text-dark hover:border-teal"
                }`}
              >
                {isOnline(a) ? <Truck className="h-4 w-4" /> : <Armchair className="h-4 w-4" />}
                {a.atmosfera}
              </button>
            ))}
          </div>

          {chosenAtmosfera && !isOnline(chosenAtmosfera) && (
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-dark">
                  <CalendarDays className="h-4 w-4 text-teal" />
                  Kunni tanlang
                </label>
                <input
                  type="date"
                  value={isoDate}
                  min={todayIso()}
                  onChange={(e) => {
                    setIsoDate(e.target.value);
                    setChosenTabel(null);
                  }}
                  className="rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-teal"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-dark">
                  <Clock className="h-4 w-4 text-teal" />
                  Soatni tanlang
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setSoat(h);
                        setChosenTabel(null);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        soat === h ? "border-teal bg-teal text-white" : "border-dark/15 text-dark hover:border-teal"
                      }`}
                    >
                      {h}:00
                    </button>
                  ))}
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-dark/50">
                <Hourglass className="h-3.5 w-3.5" />
                Stolda o&apos;tirish vaqti: {FIXED_DURATION_HOURS} soat
              </p>

              {soat != null && davomiylik != null && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark">Stolni tanlang</label>
                  {loadingTables ? (
                    <Spinner label="Stollar tekshirilmoqda..." />
                  ) : sortedTables.length === 0 ? (
                    <EmptyState
                      icon={Armchair}
                      title="Bu atmosferada hali stol yo'q"
                      description="Admin hali stol qo'shmagan bo'lishi mumkin."
                    />
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                      {sortedTables.map((t) => {
                        const busy = isBusyAtChosenTime(t);
                        return (
                          <button
                            key={t._id}
                            disabled={busy}
                            onClick={() => setChosenTabel(t)}
                            className={`aspect-square rounded-lg border text-sm font-semibold transition ${
                              busy
                                ? "cursor-not-allowed border-dark/10 bg-dark/5 text-dark/30 line-through"
                                : chosenTabel?._id === t._id
                                ? "border-teal bg-teal text-white"
                                : "border-dark/15 text-dark hover:border-teal"
                            }`}
                            title={busy ? "Bu vaqtda band" : "Bo'sh"}
                          >
                            {t.stol_raqami}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {confirmError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{confirmError}</p>
          )}

          <button
            disabled={
              !chosenAtmosfera ||
              (!isOnline(chosenAtmosfera) && (!chosenTabel || soat == null || davomiylik == null)) ||
              confirming
            }
            onClick={async () => {
              if (!chosenAtmosfera) return;
              setConfirmError(null);

              // Tasdiqlashdan oldin stol hali ham bo'shligini serverdan yana bir
              // bor tekshiramiz — eskirgan ma'lumot bilan band bo'lib qolgan
              // stolni tanlab qo'yishning oldini olamiz.
              if (!isOnline(chosenAtmosfera) && chosenTabel && soat != null && davomiylik != null) {
                setConfirming(true);
                try {
                  const params = new URLSearchParams({
                    atmosfera_id: chosenAtmosfera._id,
                    kun: String(kun),
                    oy,
                    yil: String(yil),
                    soat: String(soat),
                    davomiylik_soat: String(davomiylik),
                  });
                  const fresh = await api.get<Tabel[]>(`/tabel?${params.toString()}`);
                  const freshList = Array.isArray(fresh) ? fresh : [];
                  const freshTable = freshList.find((t) => t._id === chosenTabel._id);
                  if (freshTable?.band) {
                    setConfirmError("Afsuski, bu stol hozirgina boshqa mijoz tomonidan band qilindi. Iltimos, boshqa stol yoki vaqt tanlang.");
                    setTables(freshList);
                    setChosenTabel(null);
                    return;
                  }
                } catch {
                  // tekshirib bo'lmasa ham davom etamiz — yakuniy tekshiruv baribir
                  // buyurtma yuborilganda serverda amalga oshadi
                } finally {
                  setConfirming(false);
                }
              }

              setSelection({
                atmosfera: chosenAtmosfera,
                tabel: chosenTabel,
                isoDate,
                soat: isOnline(chosenAtmosfera) ? null : soat,
                davomiylikSoat: isOnline(chosenAtmosfera) ? null : davomiylik,
              });
            }}
            className="mt-5 w-full rounded-full bg-olive px-4 py-3 text-sm font-semibold text-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {confirming ? "Tekshirilmoqda..." : "Tasdiqlash va menyuga o'tish"}
          </button>
        </>
      )}
    </div>
  );
}
