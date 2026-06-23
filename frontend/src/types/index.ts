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
  categoryId?: number | null;
  image?: string | null;
  optionGroups?: MenuOptionGroup[];
}

export interface MenuOptionValue {
  id?: number | string;
  name: string;
  priceDelta: number | string;
}

export interface MenuOptionGroup {
  id?: number | string;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  values: MenuOptionValue[];
}

export interface StaffItem {
  id: number;
  name: string;
  role: string;
  since: string;
  orders: number;
  emoji?: string;
  phone?: string | null;
  username?: string | null;
}

export interface StockItem {
  id: number;
  name: string;
  unit: string;
  cur: number;
  min: number;
  costPerUnit?: number;
  supplierId?: number | null;
  supplierName?: string | null;
  image?: string | null;
}

export interface SupplierItem {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
}

export interface SupplyOrderItem {
  id: number;
  supplierId: number | null;
  supplierName: string;
  staffId: number | null;
  staffName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
}

export interface SupplyOrderDetailItem {
  id: number;
  supplyOrderId: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity?: number | null;
  actualUnitPrice?: number | null;
}

export interface IngredientItem {
  id: number;
  name: string;
  image?: string | null;
  stockQuantity: number;
  unit: string;
  costPerUnit: number;
  minThreshold: number;
  supplierId?: number | null;
}

export interface RecipeItem {
  id: number;
  menuId: number;
  menuName: string;
  ingredientId: number;
  ingredientName: string;
  quantityUsed: number;
  unit?: string | null;
}

export interface OrderItem {
  id: number;
  qty: number;
  note?: string | null;
}

export interface TableItem {
  id: number;
  name: string;
  seats: number;
  status: "occupied" | "free";
  items: OrderItem[];
  since: string | null;
  sessionId?: number | null;
}

export interface SaleItem {
  id: number;
  table: string;
  items: number;
  total: number;
  time: string;
  date: string;
  sessionId?: number | null;
  orders?: OrderItem[];
}

export interface SessionOrder {
  id: number;
  qty: number;
  note?: string | null;
}

export interface SessionItem {
  id: string;
  note: string;
  status: "active" | "pending_payment";
  orderStatus: "pending" | "preparing" | "ready" | null;
  items: SessionOrder[];
  createdAt: string;
  payMethod: string;
  sessionType?: "dine-in" | "takeaway";
  tableNumber?: number | null;
  staffId?: number | null;
  endedAt?: string | null;
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
