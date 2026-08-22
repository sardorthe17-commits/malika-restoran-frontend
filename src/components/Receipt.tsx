import { Receipt as ReceiptIcon, User, Phone, Armchair, CalendarClock } from "lucide-react";
import { formatSom } from "@/lib/utils";

interface ReceiptItem {
  title: string;
  price: number;
  qty: number;
}

interface ReceiptProps {
  customerName?: string;
  customerPhone?: string;
  atmosferaName: string;
  tableNumber: number;
  kun: number;
  oy: string;
  yil: number;
  soat: number;
  davomiylikSoat: number;
  items: ReceiptItem[];
  serviceFeePercent?: number;
  depositPaid?: number;
}

export function Receipt({
  customerName,
  customerPhone,
  atmosferaName,
  tableNumber,
  kun,
  oy,
  yil,
  soat,
  davomiylikSoat,
  items,
  serviceFeePercent = 0,
  depositPaid = 0,
}: ReceiptProps) {
  const itemsTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const serviceFee = Math.round((itemsTotal * serviceFeePercent) / 100);
  const grandTotal = itemsTotal + serviceFee;
  const remaining = grandTotal - depositPaid;

  return (
    <div className="frame overflow-hidden">
      <div className="flex items-center gap-2 border-b border-dark/10 bg-teal/5 px-4 py-3">
        <ReceiptIcon className="h-4 w-4 text-teal" />
        <h3 className="font-display text-base font-semibold text-dark">Schot</h3>
      </div>

      <div className="flex flex-col gap-2 border-b border-dark/10 px-4 py-3 text-sm">
        {(customerName || customerPhone) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {customerName && (
              <span className="flex items-center gap-1.5 text-dark/70">
                <User className="h-3.5 w-3.5 text-teal" /> {customerName}
              </span>
            )}
            {customerPhone && (
              <span className="flex items-center gap-1.5 text-dark/70">
                <Phone className="h-3.5 w-3.5 text-teal" /> {customerPhone}
              </span>
            )}
          </div>
        )}
        <span className="flex items-center gap-1.5 text-dark/70">
          <Armchair className="h-3.5 w-3.5 text-teal" />
          {atmosferaName} — {tableNumber}-stol
        </span>
        <span className="flex items-center gap-1.5 text-dark/70">
          <CalendarClock className="h-3.5 w-3.5 text-teal" />
          {kun}-{oy} {yil}, soat {soat}:00 dan {davomiylikSoat} soatga
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-dark/50">Buyurtma qilingan taomlar</p>
        {items.length === 0 ? (
          <p className="text-sm text-dark/50">Hali taom qo&apos;shilmagan.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {items.map((it, idx) => (
              <li key={idx} className="flex items-center justify-between gap-2">
                <span className="text-dark/80">
                  {it.title} <span className="text-dark/40">× {it.qty}</span>
                </span>
                <span className="whitespace-nowrap font-medium text-dark">{formatSom(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-dark/10 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-dark/60">
          <span>Taomlar jami</span>
          <span>{formatSom(itemsTotal)}</span>
        </div>
        {serviceFee > 0 && (
          <div className="flex items-center justify-between text-sm text-dark/60">
            <span>Xizmat haqi ({serviceFeePercent}%)</span>
            <span>{formatSom(serviceFee)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-dark/10 pt-2 font-display text-lg font-semibold text-dark">
          <span>Umumiy hisob</span>
          <span>{formatSom(grandTotal)}</span>
        </div>
        {depositPaid > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-teal">
              <span>To&apos;langan zalog</span>
              <span>− {formatSom(depositPaid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-dark">
              <span>Qolgan to&apos;lov</span>
              <span>{formatSom(Math.max(remaining, 0))}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
