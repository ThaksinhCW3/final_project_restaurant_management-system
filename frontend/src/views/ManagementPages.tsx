import { Check, Download, ExternalLink, Plus, Pencil, Printer, Trash2, Truck, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Btn } from "../components/SharedUI";
import { BILL_URL, C, kip } from "../config/constants";
import type { AppModalState } from "../types/app";
import type { IngredientItem, MenuItem, RecipeItem, SaleItem, SessionItem, StaffItem, StockItem, SupplierItem, SupplyOrderDetailItem, SupplyOrderItem } from "../types";
import { printOrderBill } from "../utils/printOrderBill";

type DispatchModal = Dispatch<SetStateAction<AppModalState>>;

const staffRoleLabel = (role: string) => (role === "manager" ? "ຜູ້ຈັດການ" : "ພະນັກງານ");
const sessionTypeLabel = (value?: string | null) => {
  if (value === "dine-in") return "ທານທີ່ຮ້ານ";
  if (value === "takeaway") return "ກັບບ້ານ";
  return value || "—";
};

export function BillingView({
  sessions,
  menu,
  setModal,
  requestPayment,
  confirmPayment,
  cancelSession,
}: {
  sessions: SessionItem[];
  menu: MenuItem[];
  setModal: DispatchModal;
  requestPayment: (id: string) => void;
  confirmPayment: (id: string) => void;
  cancelSession: (id: string) => void;
}) {
  const openCustomerView = (sessionId: string) => {
    window.open(BILL_URL(sessionId), "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>ບິນ</div>
        <Btn
          onClick={() =>
            setModal({
              type: "session-form",
              title: "ເພີ່ມບິນ",
              data: { sessionType: "dine-in", tableNumber: "", staffId: "" },
            })
          }
        >
          <Plus size={14} /> ເພີ່ມບິນ
        </Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {sessions.map((s) => {
          const total = s.items.reduce(
            (sum, item) => sum + (menu.find((m) => m.id === item.id)?.price ?? 0) * item.qty,
            0,
          );
          const pending = s.status === "pending_payment";
          return (
            <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.id}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{s.createdAt} · {sessionTypeLabel(s.payMethod || s.sessionType)} · {s.note}</div>
                </div>
                <div style={{ fontSize: 12, color: pending ? C.red : C.green, padding: "6px 10px", borderRadius: 999, background: pending ? "rgba(183,28,28,0.12)" : "rgba(74,140,69,0.12)" }}>
                  {pending ? "ລໍຖ້າຊໍາລະ" : "ເປີດ"}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>{kip(total)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: C.textDim, fontSize: 12 }}>
                <span>{s.note}</span>
                <span>{s.items.length} ລາຍການ</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn variant="secondary" onClick={() => openCustomerView(s.id)}><ExternalLink size={14} /> ເບິ່ງ</Btn>
                <Btn variant="secondary" onClick={() => printOrderBill(s, menu)}><Printer size={14} /> ພິມ</Btn>
                {!pending && (
                  <Btn
                    variant="secondary"
                    disabled={!s.orderStatus || s.items.length === 0}
                    style={!s.orderStatus || s.items.length === 0 ? { opacity: 0.52, cursor: "not-allowed" } : undefined}
                    onClick={() => requestPayment(s.id)}
                  >
                    ຊໍາລະ
                  </Btn>
                )}
                {pending && <Btn onClick={() => confirmPayment(s.id)}>ຊໍາລະ</Btn>}
                <Btn variant="danger" onClick={() => cancelSession(s.id)}>ຍົກເລີກ</Btn>
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, color: C.textDim }}>
            ບໍ່ມີບິນໃຫ້ສະແດງ
          </div>
        )}
      </div>
    </div>
  );
}

export function MenuView({
  menu,
  recipes,
  categories,
  activeCat,
  setActiveCat,
  setModal,
  toggleOk,
  deleteMenu,
}: {
  menu: MenuItem[];
  recipes: RecipeItem[];
  categories: any[];
  activeCat: string;
  setActiveCat: (value: string) => void;
  setModal: DispatchModal;
  toggleOk: (id: number) => void;
  deleteMenu: (id: number, name: string) => void;
}) {
  const [menuStatusFilter, setMenuStatusFilter] = useState<"all" | "open" | "closed">("all");
  const categoryNames = Array.from(
    new Set(
      categories
        .map((c) => c.category_name || c.categoryName || c.name)
        .filter(Boolean),
    ),
  );
  const menuCategories = ["ທັງໝົດ", ...categoryNames];
  const selectedCategory = menuCategories.includes(activeCat)
    ? activeCat
    : "ທັງໝົດ";
  const categoryFilteredMenu = menu.filter(
    (item) => selectedCategory === "ທັງໝົດ" || item.cat === selectedCategory,
  );
  const visibleMenu = categoryFilteredMenu.filter((item) => {
    if (menuStatusFilter === "open") return item.ok;
    if (menuStatusFilter === "closed") return !item.ok;
    return true;
  });
  const categoryCounts = new Map<string, number>();
  menu.forEach((item) => {
    categoryCounts.set(item.cat, (categoryCounts.get(item.cat) ?? 0) + 1);
  });
  const statusFilters = [
    { id: "all" as const, label: "ທັງໝົດ", count: categoryFilteredMenu.length, dot: C.green },
    { id: "open" as const, label: "ເປີດ", count: categoryFilteredMenu.filter((item) => item.ok).length, dot: C.green },
    { id: "closed" as const, label: "ປິດ", count: categoryFilteredMenu.filter((item) => !item.ok).length, dot: C.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {menuCategories.map((category) => {
              const selected = category === selectedCategory;
              const count = category === "ທັງໝົດ" ? menu.length : categoryCounts.get(category) ?? 0;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCat(category)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 34,
                    borderRadius: 999,
                    border: `1px solid ${selected ? "rgba(0,128,96,0.24)" : C.border}`,
                    background: selected ? "#0b8f6f" : C.card,
                    color: selected ? "#fff" : C.textMid,
                    boxShadow: selected ? "0 6px 14px rgba(11,143,111,0.18)" : "0 3px 10px rgba(60,20,20,0.05)",
                    padding: "7px 10px",
                    cursor: "pointer",
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  {selected && <Check size={13} />}
                  <span>{category}</span>
                  <span
                    style={{
                      minWidth: 22,
                      height: 20,
                      borderRadius: 999,
                      padding: "1px 7px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: selected ? "rgba(255,255,255,0.18)" : C.card2,
                      color: selected ? "#fff" : C.textDim,
                      fontSize: 11,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {statusFilters.map((filter) => {
              const selected = filter.id === menuStatusFilter;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setMenuStatusFilter(filter.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    minHeight: 30,
                    borderRadius: 999,
                    border: `1px solid ${selected ? C.borderMid : C.border}`,
                    background: selected ? C.goldDim : C.card,
                    color: selected ? C.gold : C.textMid,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    boxShadow: "0 3px 10px rgba(60,20,20,0.05)",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: filter.dot }} />
                  <span>{filter.label}</span>
                  <span style={{ color: C.textDim, background: C.card2, borderRadius: 999, minWidth: 20, padding: "1px 6px", fontSize: 11 }}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", marginLeft: "auto" }}>
          <button
            type="button"
            className="pos-toolbar-action"
            onClick={() =>
              setModal({
                type: "category-manager",
                title: "ໝວດເມນູ",
                data: {},
              })
            }
          >
            <Pencil size={14} /> ຕັ້ງຄ່າໝວດ
          </button>
          <button
            type="button"
            className="pos-toolbar-action is-primary"
            onClick={() =>
              setModal({
                type: "menu-form",
                title: "ເພີ່ມເມນູ",
                data: {
                  name: "",
                  en: "",
                  price: "",
                  cat:
                    selectedCategory === "ທັງໝົດ"
                      ? categoryNames[0] || ""
                      : selectedCategory,
                  emoji: "🍜",
                  image: "",
                  originalImage: "",
                  ok: true,
                  recipeItems: [],
                  optionGroups: [],
                },
              })
            }
          >
            <Plus size={14} /> ເພີ່ມເມນູ
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {visibleMenu.map((item) => (
          <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ height: 118, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: C.textDim }}>
                  <ImageIcon size={22} />
                  <span style={{ fontSize: 11 }}>No image</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text || "#000" }}>{item.name || "Missing Lao Name"}</div>
                  <div style={{ fontSize: 11, color: C.textDim || "#666" }}>{item.cat || "ບໍ່ມີໝວດ"}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.gold || "gold" }}>{kip(item.price)}</span>
                <span style={{ fontSize: 11, color: item.ok ? C.green || "green" : C.textDim || "#666", padding: "4px 8px", borderRadius: 999, background: item.ok ? "rgba(74,140,69,0.12)" : "rgba(90,90,90,0.08)" }}>{item.ok ? "ເປີດ" : "ປິດ"}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="menu-action-btn" onClick={() => toggleOk(item.id)} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", color: C.text }}>{item.ok ? "ປິດ" : "ເປີດ"}</button>
                <button className="menu-action-btn" onClick={() => setModal({ type: "menu-form", title: "ແກ້ໄຂເມນູ", data: { ...item, price: String(item.price), image: item.image ?? "", originalImage: item.image ?? "", optionGroups: item.optionGroups ?? [], recipeItems: recipes.filter((recipe) => recipe.menuId === item.id).map((recipe) => ({ id: recipe.id, ingredientId: recipe.ingredientId, quantityUsed: String(recipe.quantityUsed) })) } })} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Pencil size={14} /> ແກ້ໄຂ</button>
                <button className="menu-action-btn menu-delete-btn" onClick={() => deleteMenu(item.id, item.name)} style={{ width: 38, background: "rgba(208,64,48,0.12)", border: "1px solid rgba(208,64,48,0.3)", borderRadius: 10, color: C.red || "red", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockView({
  stock,
  suppliers,
  supplyOrders,
  supplyOrderDetails,
  stockFilter,
  setStockFilter,
  setModal,
  deleteStock,
}: {
  stock: StockItem[];
  suppliers: SupplierItem[];
  supplyOrders: SupplyOrderItem[];
  supplyOrderDetails: SupplyOrderDetailItem[];
  stockFilter: string;
  setStockFilter: (value: string) => void;
  setModal: DispatchModal;
  deleteStock: (id: number, name: string) => void;
}) {
  const visibleStock = stock.filter((r) => stockFilter === "all" || r.cur <= r.min);
  const lowStockCount = stock.filter((r) => r.cur <= r.min).length;
  const firstStock = stock[0];
  const pendingSupplyOrders = supplyOrders.filter(
    (order) => order.status === "pending" || order.status === "waiting_stock",
  );
  const openReceiveOrder = (order: SupplyOrderItem) => {
    const details = supplyOrderDetails.filter((detail) => detail.supplyOrderId === order.id);
    setModal({
      type: "stock-receive",
      title: `ກວດຮັບໃບສັ່ງ #${order.id}`,
      data: {
        mode: "receive",
        orderId: order.id,
        supplierName: order.supplierName,
        items: details.map((detail) => ({
          detailId: detail.id,
          ingredientId: detail.ingredientId,
          ingredientName: detail.ingredientName,
          orderedQuantity: detail.quantity,
          unitPrice: detail.unitPrice,
          receivedQuantity: detail.receivedQuantity ?? detail.quantity,
          actualUnitPrice: (detail.actualUnitPrice ?? detail.unitPrice).toLocaleString("en-US"),
        })),
      },
    });
  };
  const chipStyle = (active: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 13px",
    borderRadius: 999,
    border: `1px solid ${active ? "rgba(211,47,47,0.45)" : C.border}`,
    background: active ? "rgba(211,47,47,0.10)" : C.card,
    color: active ? C.red : C.text,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: active ? "0 8px 18px rgba(211,47,47,0.08)" : "0 6px 16px rgba(35,10,10,0.04)",
  });
  const countStyle = (active: boolean): CSSProperties => ({
    minWidth: 26,
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: active ? "#fff" : C.card2,
    color: active ? C.red : C.textDim,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
  });
  const dotStyle = (color: string): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>ຄັງສິນຄ້າ</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn
            variant="secondary"
            onClick={() =>
              setModal({
                type: "supplier-manager",
                title: "ຜູ້ສະໜອງ",
                data: { name: "", phone: "" },
              })
            }
          >
            <Truck size={14} /> ຜູ້ສະໜອງ
          </Btn>
          <Btn
            variant="secondary"
            onClick={() =>
              setModal({
                type: "stock-receive",
                title: "ຮັບເຂົ້າ",
                data: {
                  mode: "create",
                  items: [
                    {
                      ingredientId: firstStock?.id ?? "",
                      qty: "",
                      unitPrice: firstStock?.costPerUnit
                        ? firstStock.costPerUnit.toLocaleString("en-US")
                        : "",
                      supplierId: firstStock?.supplierId ?? suppliers[0]?.id ?? "",
                    },
                  ],
                },
              })
            }
          >
            <Truck size={14} /> ຮັບເຂົ້າ
          </Btn>
          <Btn
            onClick={() =>
              setModal({
                type: "stock-form",
                title: "ເພີ່ມສິນຄ້າ",
                data: { name: "", image: "", unit: "kg", cur: "", min: "", costPerUnit: "", supplierId: "" },
              })
            }
          >
            <Plus size={14} /> ເພີ່ມສິນຄ້າ
          </Btn>
        </div>
      </div>
      {pendingSupplyOrders.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>ລາຍການລໍຖ້າກວດຮັບ</div>
            <div style={{ color: C.red, fontSize: 12 }}>{pendingSupplyOrders.length} ໃບສັ່ງ</div>
          </div>
          {pendingSupplyOrders.map((order) => {
            const details = supplyOrderDetails.filter((detail) => detail.supplyOrderId === order.id);
            return (
              <div
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px minmax(160px,1fr) minmax(180px,2fr) 130px 120px",
                  gap: 12,
                  alignItems: "center",
                  padding: "14px 16px",
                  borderTop: `1px solid ${C.border}`,
                  minWidth: 760,
                }}
              >
                <strong style={{ color: C.text }}>#{order.id}</strong>
                <span style={{ color: C.text }}>{order.supplierName}</span>
                <span style={{ color: C.textDim, fontSize: 12 }}>
                  {details.map((detail) => `${detail.ingredientName} ${detail.quantity}`).join(", ") || "—"}
                </span>
                <strong style={{ color: C.red }}>{kip(order.totalAmount)}</strong>
                <Btn onClick={() => openReceiveOrder(order)}>
                  <Check size={14} /> ກວດຮັບ
                </Btn>
              </div>
            );
          })}
        </div>
      )}
      <>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setStockFilter("all")} style={chipStyle(stockFilter === "all")}>
              <span style={dotStyle(C.green)} />
              <span>ທັງໝົດ</span>
              <span style={countStyle(stockFilter === "all")}>{stock.length}</span>
            </button>
            <button onClick={() => setStockFilter("low")} style={chipStyle(stockFilter === "low")}>
              <span style={dotStyle(C.red)} />
              <span>ຕ່ຳ</span>
              <span style={countStyle(stockFilter === "low")}>{lowStockCount}</span>
            </button>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 80px 70px 80px 120px 140px 1fr", padding: "14px 16px", gap: 10, fontSize: 11, color: C.textMid, textTransform: "uppercase", minWidth: 940 }}>
          <span>ຮູບ</span><span>ສິນຄ້າ</span><span>ຈຳນວນ</span><span>ຫົວໜ່ວຍ</span><span>ຕ່ຳສຸດ</span><span>ຕົ້ນທຶນ</span><span>ຜູ້ສະໜອງ</span><span>ການຈັດການ</span>
        </div>
        {visibleStock.map((r) => {
          const low = r.cur <= r.min;
          return (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr 80px 70px 80px 120px 140px 1fr", padding: "14px 16px", borderTop: `1px solid ${C.border}`, alignItems: "center", gap: 10, minWidth: 940 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <ImageIcon size={16} color={C.textDim} />
                )}
              </div>
              <span style={{ fontSize: 13, color: C.text }}>{r.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: low ? C.red : C.text }}>{r.cur}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{r.unit}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{r.min}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{kip(r.costPerUnit ?? 0)}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{r.supplierName || "—"}</span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setModal({ type: "stock-form", title: "ແກ້ໄຂສິນຄ້າ", data: { ...r, image: r.image ?? "", cur: String(r.cur), min: String(r.min), costPerUnit: r.costPerUnit ? r.costPerUnit.toLocaleString("en-US") : "", supplierId: r.supplierId ?? "" } })} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button>
                <button onClick={() => deleteStock(r.id, r.name)} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", cursor: "pointer", color: C.red }}>ລຶບ</button>
              </div>
            </div>
          );
        })}
        </div>
      </>
    </div>
  );
}

export function ReportsView({
  sales,
  menu,
  recipes,
  ingredients,
  staff,
  sessions,
  supplyOrders,
  supplyOrderDetails,
  revenueTotal,
  activeBillsCount,
  pendingBillsCount,
}: {
  sales: SaleItem[];
  menu: MenuItem[];
  recipes: RecipeItem[];
  ingredients: IngredientItem[];
  staff: StaffItem[];
  sessions: SessionItem[];
  supplyOrders: SupplyOrderItem[];
  supplyOrderDetails: SupplyOrderDetailItem[];
  revenueTotal: number;
  activeBillsCount: number;
  pendingBillsCount: number;
}) {
  const [selectedReport, setSelectedReport] = useState("sales");
  const soldMenuQty = new Map<number, number>();
  sales.forEach((sale) => {
    (sale.orders ?? []).forEach((item) => {
      soldMenuQty.set(item.id, (soldMenuQty.get(item.id) ?? 0) + item.qty);
    });
  });

  const recipeCostByMenu = new Map<number, number>();
  recipes.forEach((recipe) => {
    const ingredient = ingredients.find((item) => item.id === recipe.ingredientId);
    const cost = recipe.quantityUsed * (ingredient?.costPerUnit ?? 0);
    recipeCostByMenu.set(recipe.menuId, (recipeCostByMenu.get(recipe.menuId) ?? 0) + cost);
  });

  const saleRows = sales.map((sale) => ({
    ບິນ: sale.table,
    ລາຍການ: sale.items,
    ລວມ: sale.total,
    ວັນທີ: sale.date,
    ເວລາ: sale.time,
  }));

  const bestSellingRows = menu
    .map((item) => ({
      ເມນູ: item.name,
      ໝວດ: item.cat,
      ຈຳນວນ: soldMenuQty.get(item.id) ?? 0,
      ລາຍຮັບ: (soldMenuQty.get(item.id) ?? 0) * item.price,
    }))
    .sort((a, b) => b.ຈຳນວນ - a.ຈຳນວນ);

  const profitRows = menu
    .map((item) => {
      const quantity = soldMenuQty.get(item.id) ?? 0;
      const revenue = quantity * item.price;
      const cost = quantity * (recipeCostByMenu.get(item.id) ?? 0);
      return {
        ເມນູ: item.name,
        ຈຳນວນ: quantity,
        ລາຍຮັບ: revenue,
        "ຕົ້ນທຶນວັດຖຸດິບປະມານ": cost,
        "ກໍາໄລປະມານ": revenue - cost,
      };
    })
    .sort((a, b) => b["ກໍາໄລປະມານ"] - a["ກໍາໄລປະມານ"]);

  const ingredientRows = ingredients.map((ingredient) => ({
    ວັດຖຸດິບ: ingredient.name,
    ຫົວໜ່ວຍ: ingredient.unit,
    ຈຳນວນ: ingredient.stockQuantity,
    ຕ່ຳສຸດ: ingredient.minThreshold,
    "ຕົ້ນທຶນ/ຫົວໜ່ວຍ": ingredient.costPerUnit,
    ສະຖານະ: ingredient.stockQuantity <= ingredient.minThreshold ? "ຕ່ຳ" : "ປົກກະຕິ",
  }));

  const importHistoryRows = supplyOrders
    .filter((order) => order.status === "completed")
    .flatMap((order) => {
    const details = supplyOrderDetails.filter((detail) => detail.supplyOrderId === order.id);
    const status =
      order.status === "pending" || order.status === "waiting_stock"
        ? "ລໍຖ້າຮັບເຂົ້າ"
        : order.status === "completed"
          ? "ສຳເລັດ"
          : order.status === "cancelled"
            ? "ຍົກເລີກ"
          : order.status || "ລໍຖ້າ";

    if (details.length === 0) {
      return [{
        ໃບສັ່ງ: `#${order.id}`,
        ວັນທີ: order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-US") : "—",
        ຜູ້ສະໜອງ: order.supplierName,
        ວັດຖຸດິບ: "—",
        ສັ່ງ: 0,
        ຮັບເຂົ້າ: 0,
        "ລາຄາ/ຫົວໜ່ວຍ": 0,
        ລວມ: order.totalAmount,
        ພະນັກງານ: order.staffName,
        ສະຖານະ: status,
      }];
    }

    return details.map((detail) => {
      const receivedQuantity = detail.receivedQuantity ?? 0;
      const unitPrice = detail.actualUnitPrice ?? detail.unitPrice;
      return {
        ໃບສັ່ງ: `#${order.id}`,
        ວັນທີ: order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-US") : "—",
        ຜູ້ສະໜອງ: order.supplierName,
        ວັດຖຸດິບ: detail.ingredientName,
        ສັ່ງ: detail.quantity,
        ຮັບເຂົ້າ: receivedQuantity,
        "ລາຄາ/ຫົວໜ່ວຍ": unitPrice,
        ລວມ: receivedQuantity * unitPrice,
        ພະນັກງານ: order.staffName,
        ສະຖານະ: status,
      };
    });
  });

  const staffShiftRows = staff.map((member) => {
    const active = sessions.filter((session) => session.staffId === member.id && session.status === "active").length;
    const pending = sessions.filter((session) => session.staffId === member.id && session.status === "pending_payment").length;
    return {
      ພະນັກງານ: member.name,
      ຕໍາແໜ່ງ: staffRoleLabel(member.role),
      ຊື່ຜູ້ໃຊ້: member.username ?? member.since,
      "ບິນທີ່ເປີດ": active,
      "ບິນລໍຖ້າຊໍາລະ": pending,
      "ອໍເດີທີ່ຮູ້ຈັກ": member.orders,
    };
  });

  const reportOptions = [
    { id: "sales", title: "ລາຍງານການຂາຍ", rows: saleRows },
    { id: "best-selling", title: "ເມນູຂາຍດີ", rows: bestSellingRows },
    { id: "profit", title: "ກໍາໄລ", rows: profitRows },
    { id: "ingredients", title: "ວັດຖຸດິບໃນຄັງ", rows: ingredientRows },
    { id: "import-history", title: "ປະຫວັດການນໍາເຂົ້າ", rows: importHistoryRows },
    { id: "staff-shift", title: "ກະພະນັກງານ", rows: staffShiftRows },
  ];
  const activeReport = reportOptions.find((report) => report.id === selectedReport) ?? reportOptions[0];

  const profitTotal = profitRows.reduce((sum, row) => sum + row["ກໍາໄລປະມານ"], 0);
  const reportCards = [
    { label: "ລາຍຮັບລວມ", value: kip(revenueTotal), extra: "ຈາກບິນຈິງ", color: C.gold },
    { label: "ກໍາໄລປະມານ", value: kip(profitTotal), extra: "ຈາກສູດວັດຖຸດິບ", color: C.green },
    { label: "ບິນ QR", value: `${activeBillsCount}`, extra: "ບິນ QR ທີ່ເປີດຢູ່", color: C.green },
    { label: "ລໍຖ້າຊໍາລະ", value: `${pendingBillsCount}`, extra: "ລໍພະນັກງານຢືນຢັນ", color: C.blue },
  ];

  const escapeCell = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const renderExportTable = (title: string, rows: Record<string, unknown>[]) => {
    const headers = Object.keys(rows[0] ?? {});
    return `
      <h2>${escapeCell(title)}</h2>
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeCell(row[header])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;
  };

  const exportSpreadsheet = () => {
    const workbook = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { margin-top: 24px; }
            table { border-collapse: collapse; margin-bottom: 18px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; }
            th { background: #f4f0f0; }
          </style>
        </head>
        <body>
          ${renderExportTable("ລາຍງານການຂາຍ", saleRows)}
          ${renderExportTable("ເມນູຂາຍດີ", bestSellingRows)}
          ${renderExportTable("ກໍາໄລ", profitRows)}
          ${renderExportTable("ວັດຖຸດິບໃນຄັງ", ingredientRows)}
          ${renderExportTable("ປະຫວັດການນໍາເຂົ້າ", importHistoryRows)}
          ${renderExportTable("ກະພະນັກງານ", staffShiftRows)}
        </body>
      </html>
    `;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `restaurant-report-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ReportTable = ({
    title,
    rows,
  }: {
    title: string;
    rows: Record<string, unknown>[];
  }) => {
    const headers = Object.keys(rows[0] ?? {});
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{rows.length} ແຖວ</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header} style={{ padding: "13px 16px", color: C.textMid, fontSize: 11, textTransform: "uppercase", textAlign: "left", borderBottom: `1px solid ${C.border}`, background: C.card2 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {headers.map((header) => (
                    <td key={header} style={{ padding: "13px 16px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
                      {typeof row[header] === "number" ? Number(row[header]).toLocaleString("en") : String(row[header] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td style={{ padding: "16px", color: C.textDim, fontSize: 13 }} colSpan={Math.max(1, headers.length)}>
                    ບໍ່ມີຂໍ້ມູນ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ color: C.textMid, fontSize: 14 }}>ລາຍງານ</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            style={{
              minWidth: 210,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 36px 10px 12px",
              color: C.text,
              cursor: "pointer",
              outline: "none",
              fontFamily: "var(--sans)",
              fontSize: 13,
            }}
          >
            {reportOptions.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title}
              </option>
            ))}
          </select>
          <Btn onClick={exportSpreadsheet}><Download size={14} /> ສົ່ງອອກສະເປຣດຊີດ</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {reportCards.map((item) => (
          <div key={item.label} style={{ flex: 1, minWidth: 140, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.4 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 7 }}>{item.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, color: item.color }}>{item.extra}</div>
          </div>
        ))}
      </div>
      <ReportTable title={activeReport.title} rows={activeReport.rows} />
    </div>
  );
}

export function SalesHistoryView({
  sales,
}: {
  sales: SaleItem[];
}) {
  const [dateFilter, setDateFilter] = useState("");
  const filteredSales = dateFilter
    ? sales.filter((sale) => sale.date === dateFilter)
    : sales;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.items, 0);
  const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const sortedSales = [...filteredSales].sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
  );
  const availableDates = Array.from(new Set(sales.map((sale) => sale.date))).sort((a, b) => b.localeCompare(a));

  const exportSales = () => {
    const headers = ["ບິນ", "ລາຍການ", "ລວມ", "ວັນທີ", "ເວລາ"];
    const rows = sortedSales.map((sale) => [
      sale.table,
      sale.items,
      sale.total,
      sale.date,
      sale.time,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "ການຂາຍ", value: String(filteredSales.length), sub: "ຊໍາລະແລ້ວ", color: C.gold },
    { label: "ລາຍຮັບ", value: kip(totalRevenue), sub: "ຊ່ວງທີ່ເລືອກ", color: C.green },
    { label: "ລາຍການ", value: String(totalItems), sub: "ລາຍການທີ່ຂາຍ", color: C.blue },
    { label: "ສະເລ່ຍ", value: kip(averageSale), sub: "ຕໍ່ບິນ", color: C.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, color: C.textMid }}>ປະຫວັດການຂາຍ</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>ການຂາຍທີ່ຊໍາລະແລ້ວຈາກບິນ</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            style={{ minWidth: 170, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, cursor: "pointer", outline: "none", fontFamily: "var(--sans)", fontSize: 13 }}
          >
            <option value="">ທຸກວັນທີ</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          <Btn onClick={exportSales}><Download size={14} /> ສົ່ງອອກ CSV</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
        {cards.map((card) => (
          <div key={card.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.4 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 8, fontFamily: "var(--heading)" }}>{card.value}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 5 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>ປະຫວັດການຂາຍ</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{sortedSales.length} ແຖວ</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                {["ບິນ", "ລາຍການ", "ລວມ", "ວັນທີ", "ເວລາ"].map((header) => (
                  <th key={header} style={{ padding: "13px 16px", color: C.textMid, fontSize: 11, textTransform: "uppercase", textAlign: "left", borderBottom: `1px solid ${C.border}`, background: C.card2 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSales.map((sale) => (
                <tr key={`${sale.id}-${sale.sessionId ?? sale.table}`}>
                  <td style={{ padding: "14px 16px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{sale.table}</td>
                  <td style={{ padding: "14px 16px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{sale.items}</td>
                  <td style={{ padding: "14px 16px", color: C.gold, fontSize: 13, borderBottom: `1px solid ${C.border}`, fontWeight: 800 }}>{kip(sale.total)}</td>
                  <td style={{ padding: "14px 16px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{sale.date}</td>
                  <td style={{ padding: "14px 16px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{sale.time}</td>
                </tr>
              ))}
              {sortedSales.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: C.textDim, fontSize: 13 }}>ຍັງບໍ່ມີປະຫວັດການຂາຍ.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StaffView({
  staff,
  isAdmin,
  setModal,
  deleteStaff,
}: {
  staff: StaffItem[];
  isAdmin: boolean;
  setModal: DispatchModal;
  deleteStaff: (id: number, name: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ color: C.textDim, fontSize: 12 }}>
          {isAdmin ? "ສິດຜູ້ຈັດການ" : "ເບິ່ງໄດ້ເທົ່ານັ້ນ"}
        </div>
        {isAdmin && (
          <Btn
            onClick={() =>
              setModal({
                type: "staff-form",
                title: "ເພີ່ມພະນັກງານ",
                data: {
                  name: "",
                  role: "employee",
                  phone: "",
                  username: "",
                  password: "",
                  since: "",
                  orders: 0,
                  emoji: "👩‍🍳",
                },
              })
            }
          >
            <Plus size={14} /> ເພີ່ມພະນັກ
          </Btn>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {staff.map((s) => (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.emoji || "👤"}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{staffRoleLabel(s.role)}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMid }}>ຊື່ຜູ້ໃຊ້</div>
                <div style={{ fontSize: 13, color: C.text }}>{s.username ?? s.since}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.textMid }}>ລາຍການ</div>
                <div style={{ fontSize: 13, color: C.text }}>{s.orders}</div>
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModal({ type: "staff-form", title: "ແກ້ໄຂພະນັກງານ", data: { ...s, password: "" } })} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button>
                <button onClick={() => deleteStaff(s.id, s.name)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", color: C.red, cursor: "pointer" }}>ລຶບ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
