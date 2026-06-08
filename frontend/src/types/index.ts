// src/types/index.ts
export interface MenuItem {
  id: number;
  name: string;
  en: string;
  price: number;
  cat: string;
  sold: number;
  ok: boolean;
  emoji: string;
}

export interface StaffItem {
  id: number;
  name: string;
  role: string;
  since: string;
  orders: number;
  emoji?: string;
}

export interface StockItem {
  id: number;
  name: string;
  unit: string;
  cur: number;
  min: number;
}

export interface OrderItem {
  id: number;
  qty: number;
}

export interface TableItem {
  id: number;
  name: string;
  seats: number;
  status: "occupied" | "free";
  items: OrderItem[];
  since: string | null;
}

export interface SaleItem {
  id: number;
  table: string;
  items: number;
  total: number;
  time: string;
  date: string;
}

export interface SessionOrder {
  id: number;
  qty: number;
}

export interface SessionItem {
  id: string;
  note: string;
  status: "active" | "pending_payment";
  orderStatus: "pending" | "preparing" | "ready" | null;
  items: SessionOrder[];
  createdAt: string;
  payMethod: string;
}

export interface ChartData {
  day: string;
  amt: number;
}

export interface PieData {
  name: string;
  value: number;
  color: string;
}