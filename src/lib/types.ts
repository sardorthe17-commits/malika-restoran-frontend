export type UserRole = "ADMIN" | "CLIENT" | "COURIER";

export interface User {
  _id: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface Category {
  _id: string;
  name: string;
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  category_id: string;
  discriptions?: string;
  image_url?: string;
}

export interface Atmosfera {
  _id: string;
  atmosfera: string; // masalan: "Tashqari", "Ichkari", "Xona", "Online"
  zalog_summasi?: number;
  xizmat_haqi_foizi?: number;
}

export interface Tabel {
  _id: string;
  atmosfera_id: string | Atmosfera;
  stol_raqami: number;
  band?: boolean; // faqat aniq soat+davomiylik so'rovi bilan so'ralganda keladi
  bookings?: { soat: number; davomiylik_soat: number }[]; // shu kunga band qilingan vaqt oraliqlari
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  qty: number;
}

export type OrderStatus = "PENDING" | "PREPARING" | "DELIVERING" | "DELIVERED" | "CANCELLED";

export type ReservationApproval = "PENDING_REVIEW" | "CONFIRMED" | "REJECTED";

export interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  address?: {
    label: string;
    address_text: string;
    lat: number;
    lng: number;
  };
  tabel_id?: string | Tabel;
  bron_kun?: number;
  bron_oy?: string;
  bron_yil?: number;
  bron_soat?: number;
  bron_davomiylik_soat?: number;
  approval_status?: ReservationApproval;
  zalog_tolandi?: number;
  total: number;
  status: OrderStatus;
  estimated_minutes?: number;
  createdAt: string;
}

export interface SavedAddress {
  _id: string;
  label: string;
  address_text: string;
  lat?: number;
  lng?: number;
}

export type SenderRole = "CLIENT" | "ADMIN";

export interface ChatMessage {
  _id: string;
  user_id: string | { _id: string; fullName?: string; phone?: string };
  sender_id: string;
  sender_role: SenderRole;
  text?: string;
  image_url?: string;
  read_by_admin: boolean;
  read_by_user: boolean;
  createdAt: string;
}

export interface Conversation {
  user: { _id: string; fullName: string; phone: string } | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
