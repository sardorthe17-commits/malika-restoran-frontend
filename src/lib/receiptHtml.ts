import { formatSom } from "./utils";
import { escapeHtml } from "./printWindow";

interface CashierItem {
  title: string;
  price: number;
  qty: number;
}

interface CashierReceiptData {
  atmosferaName: string;
  tableNumber: number;
  kun: number;
  oy: string;
  yil: number;
  soat: number;
  davomiylikSoat: number;
  items: CashierItem[];
  serviceFeePercent?: number;
  depositPaid?: number;
  customerName?: string;
  customerPhone?: string;
}

export function buildCashierReceiptHtml(data: CashierReceiptData): string {
  const {
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
    customerName,
    customerPhone,
  } = data;

  const itemsTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const serviceFee = Math.round((itemsTotal * serviceFeePercent) / 100);
  const grandTotal = itemsTotal + serviceFee;
  const remaining = Math.max(grandTotal - depositPaid, 0);
  const now = new Date();

  const itemsHtml = items
    .map(
      (it) => `<div class="row"><span>${escapeHtml(it.title)} x${it.qty}</span><span>${formatSom(it.price * it.qty)}</span></div>`
    )
    .join("");

  const customerHtml =
    customerName || customerPhone
      ? `${customerName ? `<div>Mijoz: ${escapeHtml(customerName)}</div>` : ""}${
          customerPhone ? `<div>Tel: ${escapeHtml(customerPhone)}</div>` : ""
        }<hr />`
      : "";

  const serviceFeeHtml =
    serviceFee > 0
      ? `<div class="row"><span>Xizmat haqi (${serviceFeePercent}%)</span><span>${formatSom(serviceFee)}</span></div>`
      : "";

  const depositHtml =
    depositPaid > 0
      ? `<div class="row"><span>To'langan zalog</span><span>-${formatSom(depositPaid)}</span></div>
         <div class="row bold"><span>Qolgan to'lov</span><span>${formatSom(remaining)}</span></div>`
      : "";

  return `
<p class="center bold title">MALIKA RESTORAN</p>
<p class="center">${escapeHtml(atmosferaName)} — ${tableNumber}-stol</p>
<p class="center">${kun}-${escapeHtml(oy)} ${yil}, soat ${soat}:00 — ${davomiylikSoat} soat</p>
<hr />
${customerHtml}
${itemsHtml}
<hr />
<div class="row"><span>Taomlar jami</span><span>${formatSom(itemsTotal)}</span></div>
${serviceFeeHtml}
<div class="row bold big"><span>UMUMIY</span><span>${formatSom(grandTotal)}</span></div>
${depositHtml}
<hr />
<p class="center">${now.toLocaleString("uz-UZ")}</p>
<p class="center">Xush kelibsiz!</p>
`;
}

interface KitchenItem {
  title: string;
  qty: number;
}

interface KitchenTicketData {
  atmosferaName?: string;
  tableNumber?: number;
  orderLabel: string;
  items: KitchenItem[];
  createdAt?: string;
}

export function buildKitchenTicketHtml(data: KitchenTicketData): string {
  const { atmosferaName, tableNumber, orderLabel, items, createdAt } = data;
  const time = createdAt ? new Date(createdAt) : new Date();

  const heading =
    atmosferaName && tableNumber ? `${escapeHtml(atmosferaName)} — ${tableNumber}-stol` : escapeHtml(orderLabel);

  const itemsHtml = items
    .map(
      (it) =>
        `<div class="row bold big" style="margin-bottom:6px;"><span>${escapeHtml(it.title)}</span><span>x${it.qty}</span></div>`
    )
    .join("");

  return `
<p class="center bold" style="font-size:16px;">OSHXONA</p>
<p class="center bold big">${heading}</p>
<p class="center">${time.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</p>
<hr />
${itemsHtml}
<hr />
<p class="center">${time.toLocaleDateString("uz-UZ")}</p>
`;
}
