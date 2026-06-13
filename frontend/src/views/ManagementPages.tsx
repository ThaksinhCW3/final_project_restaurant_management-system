import { ExternalLink, Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Btn } from "../components/SharedUI";
import { BILL_URL, C, CHART_DATA, PIE_DATA } from "../config/constants";
import type { AppModalState } from "../types/app";
import type { MenuItem, RecipeItem, SaleItem, SessionItem, StaffItem, StockItem } from "../types";

type DispatchModal = Dispatch<SetStateAction<AppModalState>>;

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
              title: "ເພີ່ມ Bill",
              data: { sessionType: "dine-in", tableNumber: "", staffId: "" },
            })
          }
        >
          <Plus size={14} /> ເພີ່ມ Bill
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
                  <div style={{ fontSize: 11, color: C.textDim }}>{s.createdAt} · {s.payMethod} · {s.note}</div>
                </div>
                <div style={{ fontSize: 12, color: pending ? C.red : C.green, padding: "6px 10px", borderRadius: 999, background: pending ? "rgba(183,28,28,0.12)" : "rgba(74,140,69,0.12)" }}>
                  {pending ? "ລໍຖ້າຊໍາລະ" : "ເປີດ"}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>{total.toLocaleString("en")} ₭</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: C.textDim, fontSize: 12 }}>
                <span>{s.note}</span>
                <span>{s.items.length} ລາຍການ</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn variant="secondary" onClick={() => openCustomerView(s.id)}><ExternalLink size={14} /> View</Btn>
                {!pending && <Btn variant="secondary" onClick={() => requestPayment(s.id)}>ຂໍການຊໍາລະ</Btn>}
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
  const menuCategories = ["ທັງໝົດ", ...categories.map((c) => c.category_name || c.categoryName || c.name)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>ເມນູທັງໝົດ</div>
        <Btn
          onClick={() =>
            setModal({
              type: "menu-form",
              title: "ເພີ່ມເມນູ",
              data: {
                name: "",
                en: "",
                price: "",
                cat: categories[0]?.category_name || categories[0]?.categoryName || "",
                emoji: "🍜",
                image: "",
                originalImage: "",
                ok: true,
                recipeItems: [],
              },
            })
          }
        >
          <Plus size={14} /> ເພີ່ມເມນູ
        </Btn>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {menuCategories.map((c, idx) => (
          <button
            key={`${c}-${idx}`}
            onClick={() => setActiveCat(c)}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${activeCat === c ? C.gold : C.border}`,
              background: activeCat === c ? C.goldDim : C.card,
              color: C.text,
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {menu
          .filter((item) => activeCat === "ທັງໝົດ" || item.cat === activeCat)
          .map((item) => (
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
                    <div style={{ fontSize: 11, color: C.textDim || "#666" }}>{item.en || "Missing English Name"}</div>
                  </div>
                  <div style={{ fontSize: 18 }}>{item.emoji}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.gold || "gold" }}>{item.price}</span>
                  <span style={{ fontSize: 11, color: item.ok ? C.green || "green" : C.textDim || "#666", padding: "4px 8px", borderRadius: 999, background: item.ok ? "rgba(74,140,69,0.12)" : "rgba(90,90,90,0.08)" }}>{item.ok ? "ເປີດ" : "ປິດ"}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="menu-action-btn" onClick={() => toggleOk(item.id)} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", color: C.text }}>{item.ok ? "ປິດ" : "ເປີດ"}</button>
                  <button className="menu-action-btn" onClick={() => setModal({ type: "menu-form", title: "ແກ້ໄຂເມນູ", data: { ...item, price: String(item.price), image: item.image ?? "", originalImage: item.image ?? "", recipeItems: recipes.filter((recipe) => recipe.menuId === item.id).map((recipe) => ({ id: recipe.id, ingredientId: recipe.ingredientId, quantityUsed: String(recipe.quantityUsed) })) } })} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Pencil size={14} /> ແກ້ໄຂ</button>
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
  stockFilter,
  setStockFilter,
  setModal,
  deleteStock,
}: {
  stock: StockItem[];
  stockFilter: string;
  setStockFilter: (value: string) => void;
  setModal: DispatchModal;
  deleteStock: (id: number, name: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>ຄັງສິນຄ້າ</div>
        <Btn
          onClick={() =>
            setModal({
              type: "stock-form",
              title: "ເພີ່ມສິນຄ້າ",
              data: { name: "", image: "", unit: "kg", cur: "", min: "" },
            })
          }
        >
          <Plus size={14} /> ເພີ່ມສິນຄ້າ
        </Btn>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStockFilter("all")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${stockFilter === "all" ? C.gold : C.border}`, background: stockFilter === "all" ? C.goldDim : C.card }}>ທັງໝົດ</button>
        <button onClick={() => setStockFilter("low")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${stockFilter === "low" ? C.gold : C.border}`, background: stockFilter === "low" ? C.goldDim : C.card }}>ຕ່ຳ</button>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 80px 70px 80px 1fr", padding: "14px 16px", gap: 10, fontSize: 11, color: C.textMid, textTransform: "uppercase" }}>
          <span>ຮູບ</span><span>ສິນຄ້າ</span><span>ຫົວໜ່ວຍ</span><span>ຈຳນວນ</span><span>ຫຼັກ</span><span>ການຈັດການ</span>
        </div>
        {stock.filter((r) => stockFilter === "all" || r.cur <= r.min).map((r) => {
          const low = r.cur <= r.min;
          return (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr 80px 70px 80px 1fr", padding: "14px 16px", borderTop: `1px solid ${C.border}`, alignItems: "center", gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <ImageIcon size={16} color={C.textDim} />
                )}
              </div>
              <span style={{ fontSize: 13, color: C.text }}>{r.name}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{r.unit}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: low ? C.red : C.text }}>{r.cur}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{r.min}</span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setModal({ type: "stock-receive", title: `ນໍາເຂົ້າ ${r.name}`, data: { ...r, qty: "" } })} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ຮັບເຂົ້າ</button>
                <button onClick={() => setModal({ type: "stock-form", title: "ແກ້ໄຂສິນຄ້າ", data: { ...r, image: r.image ?? "", cur: String(r.cur), min: String(r.min) } })} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button>
                <button onClick={() => deleteStock(r.id, r.name)} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", cursor: "pointer", color: C.red }}>ລຶບ</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportsView({
  sales,
  revenueTotal,
  activeBillsCount,
  pendingBillsCount,
}: {
  sales: SaleItem[];
  revenueTotal: number;
  activeBillsCount: number;
  pendingBillsCount: number;
}) {
  const occupiedTablesCount = pendingBillsCount;
  const tables = { length: activeBillsCount };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { label: "ລາຍຮັບລວມ", value: `${revenueTotal.toLocaleString("en")} ₭`, extra: "ຈາກບິນຈິງ", color: C.gold },
          { label: "ໃບບິນ", value: `${activeBillsCount}`, extra: "ບິນເປີດ", color: C.green },
          { label: "ໂຕະທີ່ໃຊ້", value: `${occupiedTablesCount}/${tables.length}`, extra: "ໂຕະທີ່ກຳລັງໃຊ້", color: C.blue },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, minWidth: 140, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.4 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 7 }}>{item.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, color: item.color }}>{item.extra}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 18 }}>ລາຍຮັບ 6 ວັນ</div>
          <div style={{ display: "grid", gap: 12 }}>
            {CHART_DATA.map((item) => (
              <div key={item.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, fontSize: 11, color: C.textMid }}>{item.day}</span>
                <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 999 }}>
                  <div style={{ width: `${Math.min(100, (item.amt / 900000) * 100)}%`, height: "100%", background: C.gold }} />
                </div>
                <span style={{ width: 80, fontSize: 11, color: C.textDim, textAlign: "right" }}>{item.amt}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 18 }}>ສ່ວນລາຍຮັບ</div>
          {PIE_DATA.map((e) => (
            <div key={e.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                <span style={{ fontSize: 11, color: C.textMid }}>{e.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.value}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>ປະຫວັດການຂາຍ</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 90px", gap: 12, fontSize: 11, color: C.textMid, textTransform: "uppercase", marginBottom: 10 }}>
          <span>ໂຕະ</span><span>ລາຍການ</span><span>ຍອດ</span><span>ວັນທີ່</span><span>ເວລາ</span>
        </div>
        {sales.map((s) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 90px", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.text }}>{s.table}</span>
            <span style={{ color: C.textDim }}>{s.items} ລາຍການ</span>
            <span style={{ color: C.gold, fontWeight: 600 }}>{s.total}</span>
            <span style={{ color: C.textDim }}>{s.date}</span>
            <span style={{ color: C.textDim }}>{s.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StaffView({
  staff,
  setModal,
  deleteStaff,
}: {
  staff: StaffItem[];
  setModal: DispatchModal;
  deleteStaff: (id: number, name: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn
          onClick={() =>
            setModal({
              type: "staff-form",
              title: "ເພີ່ມພະນັກງານ",
              data: { name: "", role: "ພະນັກງານ", since: "", orders: 0, emoji: "👩‍🍳" },
            })
          }
        >
          <Plus size={14} /> ເພີ່ມພະນັກ
        </Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {staff.map((s) => (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.emoji || "👤"}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{s.role}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMid }}>ເລີ່ມເວລາ</div>
                <div style={{ fontSize: 13, color: C.text }}>{s.since}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.textMid }}>ລາຍການ</div>
                <div style={{ fontSize: 13, color: C.text }}>{s.orders}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal({ type: "staff-form", title: "ແກ້ໄຂພະນັກງານ", data: { ...s } })} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button>
              <button onClick={() => deleteStaff(s.id, s.name)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", color: C.red, cursor: "pointer" }}>ລຶບ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
