// src/config/constants.ts
import type { MenuItem, TableItem, SaleItem, ChartData, PieData, StockItem, StaffItem, SessionItem } from "../types";

export const C = {
  bg: "#ffffff", sidebar: "#f8f4f4", card: "#ffffff", card2: "#f4f0f0",
  gold: "#d32f2f", amber: "#b71c1c", goldDim: "rgba(211,47,47,0.14)",
  red: "#b71c1c", green: "#4a8c45", blue: "#3a78b8",
  text: "#121212", textMid: "#7e1a1a", textDim: "#5a5a5a",
  border: "rgba(181,28,28,0.10)", borderMid: "rgba(181,28,28,0.25)",
};

/* ── Storage helpers (using fallback to avoid explicit global declaration) ── */
export const load = async <T>(key: string, def: T): Promise<T> => {
  try { 
    const r = await (window as any).storage.get(key); 
    return JSON.parse(r.value); 
  } catch { 
    return def; 
  }
};

export const persist = async (key: string, val: any): Promise<void> => {
  try { 
    await (window as any).storage.set(key, JSON.stringify(val)); 
  } catch {}
};

/* ── Helper utilities ── */
export const kip = (n: number): string => Number(n || 0).toLocaleString("en") + " ₭";
export const uid = (arr: { id: number }[]): number => Math.max(0, ...arr.map(x => x.id)) + 1;
export const now = (): string => new Date().toTimeString().slice(0, 5);
export const today = (): string => { 
  const d = new Date(); 
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`; 
};

export const tblTotal = (t: TableItem, menu: MenuItem[]): number =>
  t.items.reduce((s, i) => { 
    const m = menu.find(x => x.id === i.id); 
    return s + (m ? m.price * i.qty : 0); 
  }, 0);

/* ── Seed Data ── */
export const D_MENU: MenuItem[] = [
  { id: 1, name: "ເຂົ້າຊອຍໄກ່", en: "Khao Soi Chicken", price: 25000, cat: "ເຂົ້າຊອຍ", sold: 87, ok: true, emoji: "🍜" },
  { id: 2, name: "ເຂົ້າຊອຍໝູ", en: "Khao Soi Pork", price: 25000, cat: "ເຂົ້າຊອຍ", sold: 64, ok: true, emoji: "🍜" },
  { id: 3, name: "ເຂົ້າຊອຍວົວ", en: "Khao Soi Beef", price: 30000, cat: "ເຂົ້າຊອຍ", sold: 52, ok: true, emoji: "🍜" },
  { id: 4, name: "ເຂົ້າຊອຍນ້ຳ", en: "Khao Soi Soup", price: 20000, cat: "ເຂົ້າຊອຍ", sold: 43, ok: true, emoji: "🍲" },
  { id: 5, name: "ເສັ້ນຜັດ", en: "Stir-fried Noodle", price: 30000, cat: "ເສັ້ນ", sold: 31, ok: true, emoji: "🥘" },
  { id: 6, name: "ເສັ້ນໜ້ຳ", en: "Noodle Soup", price: 25000, cat: "ເສັ້ນ", sold: 29, ok: false, emoji: "🍲" },
  { id: 7, name: "ນ້ຳໝາກໄມ້", en: "Fruit Juice", price: 15000, cat: "ເຄື່ອງດື່ມ", sold: 58, ok: true, emoji: "🥤" },
  { id: 8, name: "ນ້ຳດື່ມ", en: "Water", price: 5000, cat: "ເຄື່ອງດື່ມ", sold: 120, ok: true, emoji: "💧" },
  { id: 9, name: "ໄຂ່ (ເພີ່ມ)", en: "Extra Egg", price: 5000, cat: "ເພີ່ມເຕີມ", sold: 45, ok: true, emoji: "🥚" },
  { id: 10, name: "ໝູ (ເພີ່ມ)", en: "Extra Pork", price: 10000, cat: "ເພີ່ມເຕີມ", sold: 38, ok: true, emoji: "🥩" },
];

export const D_TABLES: TableItem[] = [
  { id: 1, name: "A1", seats: 4, status: "occupied", items: [{ id: 1, qty: 2 }, { id: 8, qty: 2 }], since: "10:32" },
  { id: 2, name: "A2", seats: 4, status: "occupied", items: [{ id: 2, qty: 1 }, { id: 7, qty: 1 }], since: "11:05" },
  { id: 3, name: "A3", seats: 4, status: "free", items: [], since: null },
  { id: 4, name: "A4", seats: 2, status: "free", items: [], since: null },
  { id: 5, name: "B1", seats: 6, status: "occupied", items: [{ id: 3, qty: 3 }, { id: 7, qty: 2 }, { id: 9, qty: 1 }], since: "09:48" },
  { id: 6, name: "B2", seats: 6, status: "free", items: [], since: null },
  { id: 7, name: "C1", seats: 8, status: "occupied", items: [{ id: 1, qty: 2 }, { id: 2, qty: 2 }, { id: 4, qty: 2 }], since: "10:15" },
  { id: 8, name: "C2", seats: 8, status: "free", items: [], since: null },
  { id: 9, name: "D1", seats: 4, status: "free", items: [], since: null },
  { id: 10, name: "D2", seats: 4, status: "occupied", items: [{ id: 1, qty: 1 }, { id: 8, qty: 1 }], since: "11:20" },
];

export const D_SALES: SaleItem[] = [
  { id: 1, table: "D2", items: 3, total: 75000, time: "09:20", date: "06/07" },
  { id: 2, table: "A3", items: 5, total: 115000, time: "08:55", date: "06/07" },
  { id: 3, table: "B3", items: 4, total: 95000, time: "08:30", date: "06/07" },
];

export const D_STAFF: StaffItem[] = [
  { id: 1, name: "ນາງ ໂອເລ", role: "ເຈົ້າຂອງ", since: "ພ.ຈ 2024", orders: 320, emoji: "👩‍🍳" },
  { id: 2, name: "ທ່ານ ສົມ", role: "ພະນັກງານ", since: "ພ.ຈ 2024", orders: 280, emoji: "🧑‍🍳" },
  { id: 3, name: "ນາງ ແດງ", role: "ພະນັກງານ", since: "ທ.ວ 2024", orders: 260, emoji: "👩‍🍳" },
];

export const D_STOCK: StockItem[] = [
  { id: 1, name: "ແປ້ງເສັ້ນ", unit: "kg", cur: 8, min: 10 },
  { id: 2, name: "ເນື້ອໄກ່", unit: "kg", cur: 5, min: 5 },
  { id: 3, name: "ເນື້ອຫມູ", unit: "kg", cur: 15, min: 5 },
];

export const D_SESSIONS: SessionItem[] = [
  { id: "B001", note: "2 ຄົນ", status: "active", orderStatus: "pending", items: [{ id: 1, qty: 1 }, { id: 7, qty: 2 }], createdAt: "09:12", payMethod: "ເງິນສົດ" },
  { id: "B002", note: "ກຸ່ມເພີ່ມ", status: "active", orderStatus: null, items: [{ id: 4, qty: 1 }], createdAt: "09:40", payMethod: "QR Pay" },
];

export const MENU_CATS = ["ເຂົ້າຊອຍ", "ເສັ້ນ", "ເຄື່ອງດື່ມ", "ເພີ່ມເຕີມ"];

export const PAY_METHODS = [
  { id: "ເງິນສົດ", label: "ເງິນສົດ", emoji: "💵" },
  { id: "QR Pay", label: "QR Pay", emoji: "📲" },
  { id: "ບັດ", label: "ບັດ", emoji: "💳" },
];

export const QR_URL = (id: string): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${origin}/?bill=${id}`)}`;
};

export const CHART_DATA: ChartData[] = [
  { day: "ຈ", amt: 480000 }, { day: "ອ", amt: 520000 }, { day: "ພ", amt: 390000 },
  { day: "ພຫ", amt: 610000 }, { day: "ສ5", amt: 750000 }, { day: "ສ6", amt: 820000 },
];

export const PIE_DATA: PieData[] = [
  { name: "ເຂົ້າຊອຍ", value: 60, color: C.gold }, { name: "ເສັ້ນ", value: 20, color: C.amber },
  { name: "ດື່ມ", value: 12, color: C.blue }, { name: "ອື່ນໆ", value: 8, color: C.textMid },
];

export const CATS = ["ທັງໝົດ", "ເຂົ້າຊອຍ", "ເສັ້ນ", "ເຄື່ອງດື່ມ", "ເພີ່ມເຕີມ"];
