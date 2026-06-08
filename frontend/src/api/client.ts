import axios from "axios";
import type { MenuItem, SaleItem, SessionItem, StaffItem, StockItem, TableItem, OrderItem } from "../types";
import { now, today } from "../config/constants";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

type MenuRow = {
  menu_id: number;
  menu_name: string;
  category_id?: number | null;
  price: string | number;
  availability: number | boolean | null;
  category_name?: string | null;
};

type CategoryRow = {
  category_id: number;
  category_name: string;
};

type StaffRow = {
  id: number;
  name: string;
  role: string;
  phone?: string | null;
  username?: string | null;
};

type StockRow = {
  id: number;
  name: string;
  unit: string;
  cur: string | number;
  min: string | number;
};

type TableRow = {
  id: number;
  name: string;
  seats: number | string;
  status: string;
  since: string | null;
  session_id?: number | null;
};

type OrderRow = {
  order_id: number;
  session_id: number | null;
};

type OrderItemRow = {
  order_item_id: number;
  order_id: number;
  menu_id: number;
  menu_name?: string;
  quantity: number;
};

type SaleRow = {
  sale_id: number;
  session_id: number | null;
  total_amount: string | number;
  paid_at: string;
};

type SessionRow = {
  session_id: number;
  session_type: "dine-in" | "takeaway" | string | null;
  table_number: number | null;
  staff_id: number | null;
  first_name?: string | null;
  last_name?: string | null;
  started_at: string;
  ended_at: string | null;
  status: string | null;
};

type MenuCreateInput = {
  id?: number;
  name: string;
  en?: string;
  price: number | string;
  cat: string;
  ok: boolean;
  emoji?: string;
  sold?: number;
  categoryId?: number | null;
};

type StaffCreateInput = {
  id?: number;
  name: string;
  role: string;
  since?: string;
  orders?: number;
  emoji?: string;
  phone?: string | null;
  username?: string | null;
};

type StockCreateInput = {
  id?: number;
  name: string;
  unit: string;
  cur: number | string;
  min: number | string;
};

type SessionCreateInput = {
  sessionType?: "dine-in" | "takeaway";
  tableNumber?: number | string | null;
  staffId?: number | string | null;
  status?: "active" | "pending_payment" | "Active" | "Completed";
  endedAt?: string | null;
};

type SessionUpdateInput = Partial<SessionCreateInput> & {
  id?: string | number;
};

type SaleCreateInput = {
  id?: number;
  table: string;
  items: number;
  total: number;
  time: string;
  date: string;
  sessionId?: number | null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (value: unknown): number => toNumber(value, 0);

const parseSessionId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+)/);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
};

const sessionLabel = (id: number): string => `B${String(id).padStart(3, "0")}`;

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return today();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

const formatTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return now();
  }

  return parsed.toTimeString().slice(0, 5);
};

const splitName = (name: string): { firstName: string; lastName: string } => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const buildOrderItemMap = (orders: OrderRow[], items: OrderItemRow[]): Map<number, OrderItem[]> => {
  const byOrderId = new Map<number, OrderItem[]>();

  for (const row of items) {
    const list = byOrderId.get(row.order_id) ?? [];
    const existing = list.find(item => item.id === row.menu_id);

    if (existing) {
      existing.qty += row.quantity;
    } else {
      list.push({ id: row.menu_id, qty: row.quantity });
    }

    byOrderId.set(row.order_id, list);
  }

  const bySessionId = new Map<number, OrderItem[]>();

  for (const order of orders) {
    if (!order.session_id) {
      continue;
    }

    const orderItems = byOrderId.get(order.order_id) ?? [];
    const current = bySessionId.get(order.session_id) ?? [];

    for (const item of orderItems) {
      const existing = current.find(entry => entry.id === item.id);
      if (existing) {
        existing.qty += item.qty;
      } else {
        current.push({ ...item });
      }
    }

    bySessionId.set(order.session_id, current);
  }

  return bySessionId;
};

const normalizeMenu = (row: MenuRow): MenuItem => ({
  id: row.menu_id,
  name: row.menu_name,
  en: row.menu_name,
  price: formatMoney(row.price),
  cat: row.category_name ?? "ອື່ນໆ",
  sold: 0,
  ok: row.availability === undefined || row.availability === null ? true : Boolean(Number(row.availability)),
  emoji: "🍜",
  categoryId: row.category_id ?? null,
});

const normalizeStaff = (row: StaffRow): StaffItem => ({
  id: row.id,
  name: row.name,
  role: row.role,
  since: row.username ?? row.phone ?? "—",
  orders: 0,
  emoji: "👤",
  phone: row.phone ?? null,
  username: row.username ?? null,
});

const normalizeStock = (row: StockRow): StockItem => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  cur: toNumber(row.cur, 0),
  min: toNumber(row.min, 0),
});

const normalizeTableStatus = (value: string): "occupied" | "free" =>
  value.toLowerCase() === "free" || value.toLowerCase() === "completed" ? "free" : "occupied";

const toSessionStatus = (value: string | null | undefined): "active" | "pending_payment" =>
  value === "Completed" ? "pending_payment" : "active";

const normalizeSession = (row: SessionRow, sessionItems: Map<number, OrderItem[]>): SessionItem => {
  const label = sessionLabel(row.session_id);
  const itemCount = sessionItems.get(row.session_id) ?? [];
  const note = row.table_number ? `Table ${row.table_number}` : row.session_type ?? "Bill";

  return {
    id: label,
    note,
    status: toSessionStatus(row.status),
    orderStatus: null,
    items: itemCount,
    createdAt: formatTime(row.started_at),
    payMethod: row.session_type ?? "dine-in",
    sessionType: (row.session_type as "dine-in" | "takeaway" | null) ?? "dine-in",
    tableNumber: row.table_number,
    staffId: row.staff_id,
    endedAt: row.ended_at,
  };
};

const normalizeSale = (
  row: SaleRow,
  sessionLookup: Map<number, SessionRow>,
  sessionItems: Map<number, OrderItem[]>,
): SaleItem => {
  const session = row.session_id ? sessionLookup.get(row.session_id) : undefined;
  const itemCount = row.session_id ? sessionItems.get(row.session_id)?.length ?? 0 : 0;
  const tableLabel = session?.table_number ? `Table ${session.table_number}` : row.session_id ? sessionLabel(row.session_id) : "Bill";

  return {
    id: row.sale_id,
    table: tableLabel,
    items: itemCount,
    total: formatMoney(row.total_amount),
    time: formatTime(row.paid_at),
    date: formatDate(row.paid_at),
    sessionId: row.session_id,
  };
};

const createMenuPayload = (data: MenuCreateInput) => ({
  menu_name: data.name,
  category_id: data.categoryId ?? null,
  price: Number(data.price),
  availability: data.ok ? 1 : 0,
});

const createStaffPayload = (data: StaffCreateInput) => {
  const { firstName, lastName } = splitName(data.name);
  return {
    first_name: firstName,
    last_name: lastName,
    role: data.role === "ເຈົ້າຂອງ" || data.role === "manager" ? "manager" : "employee",
    phone: data.phone ?? null,
    username: data.username ?? `staff_${Date.now()}`,
    password: "password",
  };
};

const createSessionPayload = (data: SessionCreateInput) => ({
  session_type: data.sessionType ?? "dine-in",
  table_number: data.tableNumber == null || data.tableNumber === "" ? null : Number(data.tableNumber),
  staff_id: data.staffId == null || data.staffId === "" ? null : Number(data.staffId),
  ended_at: data.endedAt ?? null,
  status: data.status === "Completed" ? "Completed" : "Active",
});

const createSalePayload = (data: SaleCreateInput) => {
  const sessionId = data.sessionId ?? parseSessionId(data.table);

  return {
    session_id: sessionId,
    total_amount: data.total,
    paid_at: `${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
  };
};

export const apiClient = {
  menus: {
    getAll: async (): Promise<MenuItem[]> => {
      const response = await API.get<MenuRow[]>("/menus");
      return response.data.map(normalizeMenu);
    },
    create: (data: MenuCreateInput) => API.post("/menus", createMenuPayload(data)),
    update: (id: number, data: Partial<MenuCreateInput>) => API.put(`/menus/${id}`, createMenuPayload({
      id,
      name: data.name ?? "",
      en: data.en,
      price: data.price ?? 0,
      cat: data.cat ?? "ອື່ນໆ",
      ok: data.ok ?? true,
      emoji: data.emoji,
      sold: data.sold,
      categoryId: data.categoryId ?? null,
    })),
    delete: (id: number) => API.delete(`/menus/${id}`),
  },

  categories: {
    getAll: async (): Promise<any[]> => {
      const response = await API.get<CategoryRow[]>("/categories");
      return response.data.map(row => ({
        id: row.category_id,
        category_id: row.category_id,
        name: row.category_name,
        category_name: row.category_name,
      }));
    },
    create: (data: { name?: string; category_name?: string }) => API.post("/categories", {
      category_name: data.category_name ?? data.name,
    }),
    update: (id: number, data: { name?: string; category_name?: string }) => API.put(`/categories/${id}`, {
      category_name: data.category_name ?? data.name,
    }),
    delete: (id: number) => API.delete(`/categories/${id}`),
  },

  staff: {
    getAll: async (): Promise<StaffItem[]> => {
      const response = await API.get<StaffRow[]>("/staffs");
      return response.data.map(normalizeStaff);
    },
    create: async (data: StaffCreateInput) => {
      const response = await API.post("/staffs", createStaffPayload(data));
      return response;
    },
    update: (id: number, data: Partial<StaffCreateInput>) => API.put(`/staffs/${id}`, createStaffPayload({
      id,
      name: data.name ?? "",
      role: data.role ?? "ພະນັກງານ",
      since: data.since,
      orders: data.orders,
      emoji: data.emoji,
      phone: data.phone,
      username: data.username,
    })),
    delete: (id: number) => API.delete(`/staffs/${id}`),
  },

  stock: {
    getAll: async (): Promise<StockItem[]> => {
      const response = await API.get<StockRow[]>("/stock");
      return response.data.map(normalizeStock);
    },
    create: (data: StockCreateInput) => API.post("/stock", {
      name: data.name,
      unit: data.unit,
      cur: Number(data.cur),
      min: Number(data.min),
    }),
    update: (id: number, data: Partial<StockCreateInput>) => API.put(`/stock/${id}`, {
      name: data.name ?? "",
      unit: data.unit ?? "kg",
      cur: Number(data.cur ?? 0),
      min: Number(data.min ?? 0),
    }),
    delete: (id: number) => API.delete(`/stock/${id}`),
  },

  tables: {
    getAll: async (): Promise<TableItem[]> => {
      const [tablesRes, ordersRes, orderItemsRes] = await Promise.all([
        API.get<TableRow[]>("/tables"),
        API.get<OrderRow[]>("/orders"),
        API.get<OrderItemRow[]>("/order-items"),
      ]);

      const orderItemsBySession = buildOrderItemMap(ordersRes.data, orderItemsRes.data);

      return tablesRes.data.map(row => ({
        id: row.id,
        name: row.name === "Table" ? `Table ${row.id}` : row.name,
        seats: toNumber(row.seats, 4),
        status: normalizeTableStatus(row.status),
        items: orderItemsBySession.get(row.session_id ?? -1) ?? [],
        since: row.since,
        sessionId: row.session_id ?? null,
      }));
    },
    update: (id: number, data: Partial<TableItem>) => API.put(`/tables/${id}`, {
      status: data.status === "free" ? "Completed" : "Active",
      session_id: data.sessionId ?? null,
    }),
  },

  sales: {
    getAll: async (): Promise<SaleItem[]> => {
      const [salesRes, sessionsRes, ordersRes, orderItemsRes] = await Promise.all([
        API.get<SaleRow[]>("/sales"),
        API.get<SessionRow[]>("/service-sessions"),
        API.get<OrderRow[]>("/orders"),
        API.get<OrderItemRow[]>("/order-items"),
      ]);

      const sessionLookup = new Map<number, SessionRow>(sessionsRes.data.map(row => [row.session_id, row]));
      const sessionItems = buildOrderItemMap(ordersRes.data, orderItemsRes.data);

      return salesRes.data.map(row => normalizeSale(row, sessionLookup, sessionItems));
    },
    create: (data: SaleCreateInput) => API.post("/sales", createSalePayload(data)),
  },

  orders: {
    getAll: () => API.get("/orders").then(r => r.data),
    create: (data: any) => API.post("/orders", data),
    update: (id: number, data: any) => API.put(`/orders/${id}`, data),
    delete: (id: number) => API.delete(`/orders/${id}`),
  },

  sessions: {
    getAll: async (): Promise<SessionItem[]> => {
      const [sessionsRes, ordersRes, orderItemsRes] = await Promise.all([
        API.get<SessionRow[]>("/service-sessions"),
        API.get<OrderRow[]>("/orders"),
        API.get<OrderItemRow[]>("/order-items"),
      ]);

      const sessionItems = buildOrderItemMap(ordersRes.data, orderItemsRes.data);

      return sessionsRes.data
        .filter(row => row.status === "Active" || row.status === null || row.status === undefined)
        .map(row => normalizeSession(row, sessionItems));
    },
    create: async (data: SessionCreateInput): Promise<SessionItem> => {
      const response = await API.post("/service-sessions", createSessionPayload(data));
      const sessionId = Number(response.data.session_id ?? response.data.sessionId ?? response.data.id);

      return {
        id: sessionLabel(sessionId),
        note: `Table ${data.tableNumber ?? "-"}`,
        status: "active",
        orderStatus: null,
        items: [],
        createdAt: now(),
        payMethod: data.sessionType ?? "dine-in",
        sessionType: data.sessionType ?? "dine-in",
        tableNumber: data.tableNumber == null || data.tableNumber === "" ? null : Number(data.tableNumber),
        staffId: data.staffId == null || data.staffId === "" ? null : Number(data.staffId),
        endedAt: data.endedAt ?? null,
      };
    },
    update: (id: string | number, data: SessionUpdateInput) => API.put(`/service-sessions/${parseSessionId(id) ?? id}`, createSessionPayload({
      sessionType: data.sessionType,
      tableNumber: data.tableNumber,
      staffId: data.staffId,
      status: data.status,
      endedAt: data.endedAt,
    })),
    delete: (id: string | number) => API.delete(`/service-sessions/${parseSessionId(id) ?? id}`),
  },
};
