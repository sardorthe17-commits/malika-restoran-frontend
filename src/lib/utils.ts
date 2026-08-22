export const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export interface DateParts {
  kun: number;
  oy: string;
  yil: number;
}

/** "2026-08-01" ko'rinishidagi input[type=date] qiymatini backend Tabel modeliga mos { kun, oy, yil } ga aylantiradi */
export function toDateParts(isoDate: string): DateParts {
  const [yil, oyIndex, kun] = isoDate.split("-").map(Number);
  return { kun, oy: UZ_MONTHS[oyIndex - 1], yil };
}

export function formatSom(value: number) {
  return `${value.toLocaleString("uz-UZ")} so'm`;
}

/** user_id backenddan ba'zan oddiy string, ba'zan populyatsiya qilingan
 * obyekt ({_id, ...}) sifatida kelishi mumkin — ikkalasini ham to'g'ri
 * solishtirish uchun ishlatiladi. */
export function extractId(value: string | { _id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value._id;
}
