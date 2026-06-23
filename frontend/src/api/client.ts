import axios from "axios";
import type { IngredientItem, MenuItem, MenuOptionGroup, RecipeItem, SaleItem, SessionItem, StaffItem, StockItem, SupplierItem, SupplyOrderDetailItem, SupplyOrderItem, TableItem, OrderItem } from "../types";
import { now, parseCurrency, today } from "../config/constants";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

type LoginResponse = {
  message?: string;
  token: string;
  staff: {
    id: number;
    name: string;
    role: string;
    username?: string | null;
  };
};

type MenuRow = {
  menuId?: number;
  menu_id?: number;
  menuName?: string;
  menu_name?: string;
  menuImage?: string | null;
  menu_image?: string | null;
  categoryId?: number | null;
  category_id?: number | null;
  price: string | number;
  availability: number | boolean | null;
  categoryName?: string | null;
  category_name?: string | null;
  optionGroups?: MenuOptionGroup[];
  option_groups?: MenuOptionGroup[];
};

type ApiMenuOptionValue = {
  id?: number | string;
  name?: string;
  value?: string;
  priceDelta?: number | string | null;
  price_delta?: number | string | null;
  price_delta_kip?: number | string | null;
};

type ApiMenuOptionGroup = {
  id?: number | string;
  name?: string;
  selectionType?: "single" | "multiple" | string;
  selection_type?: "single" | "multiple" | string;
  required?: boolean | number | string | null;
  values?: ApiMenuOptionValue[];
};

type CategoryRow = {
  categoryId?: number;
  category_id?: number;
  categoryName?: string;
  category_name?: string;
};

type StaffRow = {
  id: number;
  staffId?: number;
  staff_id?: number;
  name: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  role: string;
  phone?: string | null;
  username?: string | null;
};

type StockRow = {
  id: number;
  name: string;
  image?: string | null;
  ingredient_image?: string | null;
  unit: string;
  cur: string | number;
  min: string | number;
  costPerUnit?: string | number | null;
  cost_per_unit?: string | number | null;
  supplierId?: number | null;
  supplier_id?: number | null;
  supplierName?: string | null;
  supplier_name?: string | null;
};

type SupplierRow = {
  supplierId?: number;
  supplier_id?: number;
  supplierName?: string;
  supplier_name?: string;
  phone?: string | null;
  address?: string | null;
};

type SupplyOrderRow = {
  supply_order_id?: number;
  supplier_order_id?: number;
  supplier_id?: number | null;
  supplier_name?: string | null;
  staff_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  order_date?: string;
  total_amount?: string | number | null;
  status?: string | null;
};

type SupplyOrderDetailRow = {
  supply_order_detail_id?: number;
  supplier_order_detail_id?: number;
  supply_order_id?: number;
  supplier_order_id?: number;
  ingredient_id?: number;
  ingredient_name?: string | null;
  quantity?: string | number;
  unit_price?: string | number;
  received_quantity?: string | number | null;
  actual_unit_price?: string | number | null;
};

type IngredientRow = {
  ingredientId?: number;
  ingredient_id?: number;
  ingredientName?: string;
  ingredient_name?: string;
  ingredientImage?: string | null;
  ingredient_image?: string | null;
  stockQuantity?: string | number | null;
  stock_quantity?: string | number | null;
  unit?: string | null;
  costPerUnit?: string | number | null;
  cost_per_unit?: string | number | null;
  minThreshold?: string | number | null;
  min_thereshold?: string | number | null;
  supplierId?: number | null;
  supplier_id?: number | null;
};

type RecipeRow = {
  recipeId?: number;
  recipe_id?: number;
  menuId?: number;
  menu_id?: number;
  menuName?: string;
  menu_name?: string;
  ingredientId?: number;
  ingredient_id?: number;
  ingredientName?: string;
  ingredient_name?: string;
  quantityUsed?: string | number;
  quantity_used?: string | number;
  unit?: string | null;
};

type TableRow = {
  id: number;
  name: string;
  seats: number | string;
  status: string;
  since: string | null;
  session_id?: number | null;
  sessionId?: number | null;
};

type TableCreateInput = {
  tableNumber: number | string;
  seats: number | string;
  zone?: string | null;
};

type OrderRow = {
  orderId?: number;
  order_id: number;
  session_id: number | null;
  sessionId?: number | null;
  staff_id?: number | null;
  staffId?: number | null;
  status?: string;
  ordered_at?: string;
  orderedAt?: string;
};

type OrderItemRow = {
  orderItemId?: number;
  order_item_id: number;
  orderId?: number;
  order_id: number;
  menuId?: number;
  menu_id: number;
  menuName?: string;
  menu_name?: string;
  quantity: number;
  note?: string | null;
};

type SaleRow = {
  salesId?: number;
  sale_id?: number;
  sessionId?: number | null;
  session_id: number | null;
  totalAmount?: string | number;
  total_amount: string | number;
  paidAt?: string;
  paid_at: string;
};

type SessionRow = {
  sessionId?: number;
  session_id: number;
  sessionType?: "dine-in" | "takeaway" | string | null;
  session_type: "dine-in" | "takeaway" | string | null;
  note?: string | null;
  tableNumber?: number | null;
  table_number: number | null;
  staffId?: number | null;
  staff_id: number | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  startedAt?: string;
  started_at: string;
  endedAt?: string | null;
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
  image?: string | null;
  optionGroups?: MenuOptionGroup[];
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
  password?: string | null;
};

type StockCreateInput = {
  id?: number;
  name: string;
  unit: string;
  cur: number | string;
  min: number | string;
  image?: string | null;
  costPerUnit?: number | string;
  supplierId?: number | string | null;
};

type SupplierCreateInput = {
  id?: number;
  name?: string;
  supplier_name?: string;
  phone?: string | null;
  address?: string | null;
};

type SupplyOrderListInput = {
  staffId?: number | string | null;
  items: Array<{
    ingredientId: number | string;
    supplierId: number | string;
    quantity: number | string;
    unitPrice: number | string;
  }>;
};

type SupplyOrderReceiveInput = {
  staffId?: number | string | null;
  items: Array<{
    detailId: number | string;
    ingredientId: number | string;
    receivedQuantity: number | string;
    actualUnitPrice: number | string;
  }>;
  remark?: string;
};

type RecipeCreateInput = {
  id?: number;
  menuId: number | string;
  ingredientId: number | string;
  quantityUsed: number | string;
};

type SessionCreateInput = {
  sessionType?: "dine-in" | "takeaway";
  note?: string;
  tableNumber?: number | string | null;
  staffId?: number | string | null;
  status?: "active" | "pending_payment" | "Active" | "PendingPayment" | "Completed";
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
  const n = typeof value === "string" ? parseCurrency(value) : Number(value);
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

const toMysqlDateTime = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
  }

  return parsed.toISOString().slice(0, 19).replace("T", " ");
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

const itemNoteKey = (note?: string | null): string => String(note ?? "").trim();

const buildOrderItemMap = (orders: OrderRow[], items: OrderItemRow[]): Map<number, OrderItem[]> => {
  const byOrderId = new Map<number, OrderItem[]>();

  for (const row of items) {
    const orderId = row.order_id ?? row.orderId ?? 0;
    const menuId = row.menu_id ?? row.menuId ?? 0;
    const list = byOrderId.get(orderId) ?? [];
    const note = itemNoteKey(row.note);
    const existing = list.find(item => item.id === menuId && itemNoteKey(item.note) === note);

    if (existing) {
      existing.qty += row.quantity;
    } else {
      list.push({ id: menuId, qty: row.quantity, note });
    }

    byOrderId.set(orderId, list);
  }

  const bySessionId = new Map<number, OrderItem[]>();

  for (const order of orders) {
    const sessionId = order.session_id ?? order.sessionId ?? null;
    const orderId = order.order_id ?? order.orderId ?? 0;

    if (!sessionId) {
      continue;
    }

    const orderItems = byOrderId.get(orderId) ?? [];
    const current = bySessionId.get(sessionId) ?? [];

    for (const item of orderItems) {
      const existing = current.find(entry => entry.id === item.id && itemNoteKey(entry.note) === itemNoteKey(item.note));
      if (existing) {
        existing.qty += item.qty;
      } else {
        current.push({ ...item });
      }
    }

    bySessionId.set(sessionId, current);
  }

  return bySessionId;
};

const normalizeOptionGroups = (groups: ApiMenuOptionGroup[] | undefined): MenuOptionGroup[] =>
  (groups ?? []).map((group) => ({
    id: group.id,
    name: group.name ?? "",
    selectionType: group.selectionType === "multiple" || group.selection_type === "multiple" ? "multiple" : "single",
    required: group.required === true || group.required === 1 || group.required === "1",
    values: (group.values ?? []).map((value) => ({
      id: value.id,
      name: value.name ?? value.value ?? "",
      priceDelta: toNumber(value.priceDelta ?? value.price_delta ?? value.price_delta_kip, 0),
    })),
  }));

const normalizeMenu = (row: MenuRow): MenuItem => ({
  id: row.menuId ?? row.menu_id ?? 0,
  name: row.menuName ?? row.menu_name ?? "",
  en: row.menuName ?? row.menu_name ?? row.categoryName ?? row.category_name ?? "Menu item",
  price: formatMoney(row.price),
  cat: row.categoryName ?? row.category_name ?? "ອື່ນໆ",
  sold: 0,
  ok: row.availability === undefined || row.availability === null ? true : Boolean(Number(row.availability)),
  emoji: row.menuImage ? "🖼️" : "🍜",
  categoryId: row.categoryId ?? row.category_id ?? null,
  image: row.menuImage ?? row.menu_image ?? null,
  optionGroups: normalizeOptionGroups(row.optionGroups ?? row.option_groups),
});

const normalizeStaff = (row: StaffRow): StaffItem => ({
  id: row.staffId ?? row.staff_id ?? row.id,
  name: row.name || `${row.firstName ?? row.first_name ?? ""} ${row.lastName ?? row.last_name ?? ""}`.trim(),
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
  image: row.image ?? row.ingredient_image ?? null,
  unit: row.unit,
  cur: toNumber(row.cur, 0),
  min: toNumber(row.min, 0),
  costPerUnit: toNumber(row.costPerUnit ?? row.cost_per_unit, 0),
  supplierId: row.supplierId ?? row.supplier_id ?? null,
  supplierName: row.supplierName ?? row.supplier_name ?? null,
});

const normalizeSupplier = (row: SupplierRow): SupplierItem => ({
  id: row.supplierId ?? row.supplier_id ?? 0,
  name: row.supplierName ?? row.supplier_name ?? "",
  phone: row.phone ?? null,
  address: row.address ?? null,
});

const normalizeSupplyOrder = (row: SupplyOrderRow): SupplyOrderItem => ({
  id: row.supply_order_id ?? row.supplier_order_id ?? 0,
  supplierId: row.supplier_id ?? null,
  supplierName: row.supplier_name ?? "Supplier",
  staffId: row.staff_id ?? null,
  staffName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Staff",
  orderDate: row.order_date ?? "",
  totalAmount: toNumber(row.total_amount, 0),
  status: row.status ?? "pending",
});

const normalizeSupplyOrderDetail = (row: SupplyOrderDetailRow): SupplyOrderDetailItem => ({
  id: row.supply_order_detail_id ?? row.supplier_order_detail_id ?? 0,
  supplyOrderId: row.supply_order_id ?? row.supplier_order_id ?? 0,
  ingredientId: row.ingredient_id ?? 0,
  ingredientName: row.ingredient_name ?? "Ingredient",
  quantity: toNumber(row.quantity, 0),
  unitPrice: toNumber(row.unit_price, 0),
  receivedQuantity:
    row.received_quantity === null || row.received_quantity === undefined
      ? null
      : toNumber(row.received_quantity, 0),
  actualUnitPrice:
    row.actual_unit_price === null || row.actual_unit_price === undefined
      ? null
      : toNumber(row.actual_unit_price, 0),
});

const normalizeIngredient = (row: IngredientRow): IngredientItem => ({
  id: row.ingredientId ?? row.ingredient_id ?? 0,
  name: row.ingredientName ?? row.ingredient_name ?? "",
  image: row.ingredientImage ?? row.ingredient_image ?? null,
  stockQuantity: toNumber(row.stockQuantity ?? row.stock_quantity, 0),
  unit: row.unit ?? "pcs",
  costPerUnit: toNumber(row.costPerUnit ?? row.cost_per_unit, 0),
  minThreshold: toNumber(row.minThreshold ?? row.min_thereshold, 0),
  supplierId: row.supplierId ?? row.supplier_id ?? null,
});

const normalizeRecipe = (row: RecipeRow): RecipeItem => ({
  id: row.recipeId ?? row.recipe_id ?? 0,
  menuId: row.menuId ?? row.menu_id ?? 0,
  menuName: row.menuName ?? row.menu_name ?? "Menu item",
  ingredientId: row.ingredientId ?? row.ingredient_id ?? 0,
  ingredientName: row.ingredientName ?? row.ingredient_name ?? "Ingredient",
  quantityUsed: toNumber(row.quantityUsed ?? row.quantity_used, 0),
  unit: row.unit ?? null,
});

const normalizeTableStatus = (value: string): "occupied" | "free" =>
  value.toLowerCase() === "free" || value.toLowerCase() === "completed" ? "free" : "occupied";

const toSessionStatus = (value: string | null | undefined): "active" | "pending_payment" =>
  value === "PendingPayment" || value === "pending_payment" ? "pending_payment" : "active";

const toOrderStatus = (value: string | null | undefined): SessionItem["orderStatus"] => {
  if (value === "Preparing") return "preparing";
  if (value === "Served") return "ready";
  if (value === "Pending") return "pending";
  return null;
};

const buildOrderStatusMap = (orders: OrderRow[]): Map<number, SessionItem["orderStatus"]> => {
  const bySessionId = new Map<number, SessionItem["orderStatus"]>();

  for (const order of orders) {
    const sessionId = order.session_id ?? order.sessionId ?? null;
    if (!sessionId || bySessionId.has(sessionId)) continue;
    bySessionId.set(sessionId, toOrderStatus(order.status));
  }

  return bySessionId;
};

const normalizeSession = (
  row: SessionRow,
  sessionItems: Map<number, OrderItem[]>,
  orderStatuses: Map<number, SessionItem["orderStatus"]>,
): SessionItem => {
  const sessionId = row.sessionId ?? row.session_id;
  const label = sessionLabel(sessionId);
  const itemCount = sessionItems.get(sessionId) ?? [];
  const tableNumber = row.tableNumber ?? row.table_number;
  const sessionType = row.sessionType ?? row.session_type ?? "dine-in";
  const note = row.note || (tableNumber ? `Table ${tableNumber}` : sessionType);

  return {
    id: label,
    note,
    status: toSessionStatus(row.status),
    orderStatus: orderStatuses.get(sessionId) ?? null,
    items: itemCount,
    createdAt: formatTime(row.startedAt ?? row.started_at),
    payMethod: sessionType as string,
    sessionType: sessionType as "dine-in" | "takeaway",
    tableNumber,
    staffId: row.staffId ?? row.staff_id,
    endedAt: row.endedAt ?? row.ended_at,
  };
};

const normalizeSale = (
  row: SaleRow,
  sessionLookup: Map<number, SessionRow>,
  sessionItems: Map<number, OrderItem[]>,
): SaleItem => {
  const sessionId = row.sessionId ?? row.session_id ?? null;
  const session = sessionId ? sessionLookup.get(sessionId) : undefined;
  const itemCount = sessionId ? sessionItems.get(sessionId)?.length ?? 0 : 0;
  const tableLabel = session?.tableNumber ?? session?.table_number ? `Table ${session?.tableNumber ?? session?.table_number}` : sessionId ? sessionLabel(sessionId) : "Bill";

  return {
    id: row.salesId ?? row.sale_id ?? 0,
    table: tableLabel,
    items: itemCount,
    total: formatMoney(row.totalAmount ?? row.total_amount),
    time: formatTime(row.paidAt ?? row.paid_at),
    date: formatDate(row.paidAt ?? row.paid_at),
    sessionId,
  };
};

const createMenuPayload = (data: MenuCreateInput) => ({
  menu_name: data.name,
  menu_image: data.image ?? null,
  category_id: data.categoryId ?? null,
  price: parseCurrency(data.price),
  availability: data.ok ? 1 : 0,
  option_groups: (data.optionGroups ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    required: Boolean(group.required),
    values: (group.values ?? []).map((value) => ({
      id: value.id,
      name: value.name,
      priceDelta: parseCurrency(value.priceDelta || 0),
    })),
  })),
});

const createStaffPayload = (data: StaffCreateInput) => {
  const { firstName, lastName } = splitName(data.name);
  const payload: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    role: data.role === "ເຈົ້າຂອງ" || data.role === "manager" ? "manager" : "employee",
    phone: data.phone ?? null,
    username: data.username ?? `staff_${Date.now()}`,
  };

  if (data.password) {
    payload.password = data.password;
  }

  return payload;
};

const createSessionPayload = (data: SessionCreateInput) => ({
  session_type: data.sessionType ?? "dine-in",
  note: data.note ?? "",
  table_number: data.tableNumber == null || data.tableNumber === "" ? null : Number(data.tableNumber),
  staff_id: data.staffId == null || data.staffId === "" ? null : Number(data.staffId),
  ended_at: toMysqlDateTime(data.endedAt),
  status: data.status === "Completed" ? "Completed" : data.status === "PendingPayment" || data.status === "pending_payment" ? "PendingPayment" : "Active",
});

const createSalePayload = (data: SaleCreateInput) => {
  const sessionId = data.sessionId ?? parseSessionId(data.table);

  return {
    session_id: sessionId,
    total_amount: data.total,
    paid_at: `${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
  };
};

const createRecipePayload = (data: RecipeCreateInput) => ({
  menu_id: Number(data.menuId),
  ingredient_id: Number(data.ingredientId),
  quantity_used: Number(data.quantityUsed),
});

export const apiClient = {
  auth: {
    setToken: setAuthToken,
    login: async (data: { username: string; password: string }): Promise<LoginResponse> => {
      const response = await API.post<LoginResponse>("/staffs/login", data);
      return response.data;
    },
  },

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
      image: data.image ?? null,
      optionGroups: data.optionGroups ?? [],
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
      password: data.password,
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
      image: data.image ?? null,
      unit: data.unit,
      cur: Number(data.cur),
      min: Number(data.min),
      cost_per_unit: parseCurrency(data.costPerUnit ?? 0),
      supplier_id: data.supplierId === "" || data.supplierId == null ? null : Number(data.supplierId),
    }),
    update: (id: number, data: Partial<StockCreateInput>) => API.put(`/stock/${id}`, {
      name: data.name ?? "",
      image: data.image ?? null,
      unit: data.unit ?? "kg",
      cur: Number(data.cur ?? 0),
      min: Number(data.min ?? 0),
      cost_per_unit: parseCurrency(data.costPerUnit ?? 0),
      supplier_id: data.supplierId === "" || data.supplierId == null ? null : Number(data.supplierId),
    }),
    receive: (id: number, data: {
      qty: number | string;
      costPrice?: number | string;
      supplierId?: number | string | null;
      staffId?: number | string | null;
      remark?: string;
    }) => API.post(`/stock/${id}/receive`, {
      qty: Number(data.qty),
      cost_price: parseCurrency(data.costPrice ?? 0),
      supplier_id: data.supplierId === "" || data.supplierId == null ? null : Number(data.supplierId),
      staff_id: data.staffId === "" || data.staffId == null ? null : Number(data.staffId),
      remark: data.remark ?? "",
    }),
    delete: (id: number) => API.delete(`/stock/${id}`),
  },

  suppliers: {
    getAll: async (): Promise<SupplierItem[]> => {
      const response = await API.get<SupplierRow[]>("/suppliers");
      return response.data.map(normalizeSupplier);
    },
    create: (data: SupplierCreateInput) => API.post("/suppliers", {
      supplier_name: data.supplier_name ?? data.name,
      phone: data.phone ?? "",
    }),
    update: (id: number, data: SupplierCreateInput) => API.put(`/suppliers/${id}`, {
      supplier_name: data.supplier_name ?? data.name,
      phone: data.phone ?? "",
    }),
    delete: (id: number) => API.delete(`/suppliers/${id}`),
  },

  supplyOrders: {
    getAll: async (): Promise<SupplyOrderItem[]> => {
      const response = await API.get<SupplyOrderRow[]>("/supplier-orders");
      return response.data.map(normalizeSupplyOrder);
    },
    createList: (data: SupplyOrderListInput) => API.post("/supplier-orders/list", {
      staff_id: data.staffId === "" || data.staffId == null ? null : Number(data.staffId),
      items: data.items.map((item) => ({
        ingredient_id: Number(item.ingredientId),
        supplier_id: Number(item.supplierId),
        quantity: Number(item.quantity),
        unit_price: parseCurrency(item.unitPrice),
      })),
    }),
    receive: (id: number, data: SupplyOrderReceiveInput) => API.post(`/supplier-orders/${id}/receive`, {
      staff_id: data.staffId === "" || data.staffId == null ? null : Number(data.staffId),
      remark: data.remark ?? "",
      items: data.items.map((item) => ({
        detail_id: Number(item.detailId),
        ingredient_id: Number(item.ingredientId),
        received_quantity: Number(item.receivedQuantity),
        actual_unit_price: parseCurrency(item.actualUnitPrice),
      })),
    }),
  },

  supplyOrderDetails: {
    getAll: async (): Promise<SupplyOrderDetailItem[]> => {
      const response = await API.get<SupplyOrderDetailRow[]>("/supplier-order-details");
      return response.data.map(normalizeSupplyOrderDetail);
    },
  },

  ingredients: {
    getAll: async (): Promise<IngredientItem[]> => {
      const response = await API.get<IngredientRow[]>("/ingredients");
      return response.data.map(normalizeIngredient);
    },
  },

  recipes: {
    getAll: async (): Promise<RecipeItem[]> => {
      const response = await API.get<RecipeRow[]>("/recipes");
      return response.data.map(normalizeRecipe);
    },
    create: (data: RecipeCreateInput) => API.post("/recipes", createRecipePayload(data)),
    update: (id: number, data: RecipeCreateInput) => API.put(`/recipes/${id}`, createRecipePayload(data)),
    delete: (id: number) => API.delete(`/recipes/${id}`),
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
        items: orderItemsBySession.get(row.sessionId ?? row.session_id ?? -1) ?? [],
        since: row.since,
        sessionId: row.sessionId ?? row.session_id ?? null,
      }));
    },
    create: (data: TableCreateInput) => API.post("/tables", {
      table_number: Number(data.tableNumber),
      capacity: Number(data.seats),
      zone: data.zone ?? null,
    }),
    update: (id: number, data: Partial<TableItem>) => API.put(`/tables/${id}`, {
      status: data.status === "free" ? "Completed" : "Active",
      session_id: data.sessionId ?? null,
      capacity: data.seats,
    }),
    delete: (id: number) => API.delete(`/tables/${id}`),
  },

  sales: {
    getAll: async (): Promise<SaleItem[]> => {
      const [salesRes, sessionsRes, ordersRes, orderItemsRes] = await Promise.all([
        API.get<SaleRow[]>("/sales"),
        API.get<SessionRow[]>("/service-sessions"),
        API.get<OrderRow[]>("/orders"),
        API.get<OrderItemRow[]>("/order-items"),
      ]);

      const sessionLookup = new Map<number, SessionRow>(sessionsRes.data.map(row => [row.sessionId ?? row.session_id, row]));
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
      const orderStatuses = buildOrderStatusMap(ordersRes.data);

      return sessionsRes.data
        .filter(row => row.status === "Active" || row.status === "PendingPayment" || row.status === null || row.status === undefined)
        .map(row => normalizeSession(row, sessionItems, orderStatuses));
    },
    create: async (data: SessionCreateInput): Promise<SessionItem> => {
      const response = await API.post("/service-sessions", createSessionPayload(data));
      const sessionId = Number(response.data.session_id ?? response.data.sessionId ?? response.data.id);

      return {
        id: sessionLabel(sessionId),
        note: data.note || (data.tableNumber ? `Table ${data.tableNumber}` : data.sessionType ?? "dine-in"),
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
      note: data.note,
      tableNumber: data.tableNumber,
      staffId: data.staffId,
      status: data.status,
      endedAt: data.endedAt,
    })),
    replaceItems: (id: string | number, items: OrderItem[]) => API.put(`/service-sessions/${parseSessionId(id) ?? id}/items`, {
      items: items.map(item => ({ menu_id: item.id, quantity: item.qty, note: item.note ?? "" })),
    }),
    delete: (id: string | number) => API.delete(`/service-sessions/${parseSessionId(id) ?? id}`),
  },
};
