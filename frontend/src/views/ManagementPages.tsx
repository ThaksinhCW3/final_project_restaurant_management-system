import { Download, ExternalLink, Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Btn } from "../components/SharedUI";
import { BILL_URL, C } from "../config/constants";
import type { AppModalState } from "../types/app";
import type { IngredientItem, MenuItem, RecipeItem, SaleItem, SessionItem, StaffItem, StockItem } from "../types";

type DispatchModal = Dispatch<SetStateAction<AppModalState>>;

const staffRoleLabel = (role: string) => (role === "manager" ? "Admin" : "Staff");

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
  const categoryNames = Array.from(
    new Set(
      [
        ...categories.map((c) => c.category_name || c.categoryName || c.name),
        ...menu.map((item) => item.cat),
      ].filter(Boolean),
    ),
  );
  const menuCategories = ["ທັງໝົດ", ...categoryNames];
  const selectedCategory = menuCategories.includes(activeCat)
    ? activeCat
    : "ທັງໝົດ";
  const visibleMenu = menu.filter(
    (item) => selectedCategory === "ທັງໝົດ" || item.cat === selectedCategory,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>ເມນູທັງໝົດ</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn
            variant="secondary"
            onClick={() =>
              setModal({
                type: "category-form",
                title: "ເພີ່ມໝວດເມນູ",
                data: { name: "" },
              })
            }
          >
            <Plus size={14} /> ເພີ່ມໝວດ
          </Btn>
          <Btn
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
          </Btn>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, color: C.textMid, fontSize: 12 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: 1.1 }}>ໝວດ</span>
          <select
            value={selectedCategory}
            onChange={(e) => setActiveCat(e.target.value)}
            style={{
              minWidth: 180,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "10px 36px 10px 14px",
              color: C.text,
              cursor: "pointer",
              outline: "none",
              fontFamily: "var(--sans)",
              fontSize: 13,
            }}
          >
            {menuCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span style={{ color: C.textDim, fontSize: 12 }}>
          {visibleMenu.length} ລາຍການ
        </span>
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
  menu,
  recipes,
  ingredients,
  staff,
  sessions,
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
  revenueTotal: number;
  activeBillsCount: number;
  pendingBillsCount: number;
}) {
  const [selectedReport, setSelectedReport] = useState("sales");
  const menuQty = new Map<number, number>();
  menu.forEach((item) => {
    if (item.sold > 0) menuQty.set(item.id, item.sold);
  });
  sessions.forEach((session) => {
    session.items.forEach((item) => {
      menuQty.set(item.id, (menuQty.get(item.id) ?? 0) + item.qty);
    });
  });

  const recipeCostByMenu = new Map<number, number>();
  recipes.forEach((recipe) => {
    const ingredient = ingredients.find((item) => item.id === recipe.ingredientId);
    const cost = recipe.quantityUsed * (ingredient?.costPerUnit ?? 0);
    recipeCostByMenu.set(recipe.menuId, (recipeCostByMenu.get(recipe.menuId) ?? 0) + cost);
  });

  const saleRows = sales.map((sale) => ({
    Bill: sale.table,
    Items: sale.items,
    Total: sale.total,
    Date: sale.date,
    Time: sale.time,
  }));

  const bestSellingRows = menu
    .map((item) => ({
      Menu: item.name,
      Category: item.cat,
      Quantity: menuQty.get(item.id) ?? 0,
      Revenue: (menuQty.get(item.id) ?? 0) * item.price,
    }))
    .sort((a, b) => b.Quantity - a.Quantity);

  const profitRows = menu
    .map((item) => {
      const quantity = menuQty.get(item.id) ?? 0;
      const revenue = quantity * item.price;
      const cost = quantity * (recipeCostByMenu.get(item.id) ?? 0);
      return {
        Menu: item.name,
        Quantity: quantity,
        Revenue: revenue,
        "Est. Ingredient Cost": cost,
        "Est. Profit": revenue - cost,
      };
    })
    .sort((a, b) => b["Est. Profit"] - a["Est. Profit"]);

  const ingredientRows = ingredients.map((ingredient) => ({
    Ingredient: ingredient.name,
    Unit: ingredient.unit,
    Stock: ingredient.stockQuantity,
    Minimum: ingredient.minThreshold,
    "Cost / Unit": ingredient.costPerUnit,
    Status: ingredient.stockQuantity <= ingredient.minThreshold ? "Low" : "OK",
  }));

  const staffShiftRows = staff.map((member) => {
    const active = sessions.filter((session) => session.staffId === member.id && session.status === "active").length;
    const pending = sessions.filter((session) => session.staffId === member.id && session.status === "pending_payment").length;
    return {
      Staff: member.name,
      Role: staffRoleLabel(member.role),
      Username: member.username ?? member.since,
      "Active Bills": active,
      "Pending Bills": pending,
      "Known Orders": member.orders,
    };
  });

  const reportOptions = [
    { id: "sales", title: "Sale report", rows: saleRows },
    { id: "best-selling", title: "Best selling menu", rows: bestSellingRows },
    { id: "profit", title: "Profit", rows: profitRows },
    { id: "ingredients", title: "Ingredient in stock", rows: ingredientRows },
    { id: "staff-shift", title: "Staff shift", rows: staffShiftRows },
  ];
  const activeReport = reportOptions.find((report) => report.id === selectedReport) ?? reportOptions[0];

  const profitTotal = profitRows.reduce((sum, row) => sum + row["Est. Profit"], 0);
  const reportCards = [
    { label: "ລາຍຮັບລວມ", value: `${revenueTotal.toLocaleString("en")} ₭`, extra: "ຈາກບິນຈິງ", color: C.gold },
    { label: "ກໍາໄລປະມານ", value: `${profitTotal.toLocaleString("en")} ₭`, extra: "ຈາກສູດວັດຖຸດິບ", color: C.green },
    { label: "QR Bill", value: `${activeBillsCount}`, extra: "ບິນ QR ທີ່ເປີດຢູ່", color: C.green },
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
          ${renderExportTable("Sale report", saleRows)}
          ${renderExportTable("Best selling menu", bestSellingRows)}
          ${renderExportTable("Profit", profitRows)}
          ${renderExportTable("Ingredient in stock", ingredientRows)}
          ${renderExportTable("Staff shift", staffShiftRows)}
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
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{rows.length} rows</div>
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
                    No data
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
          <Btn onClick={exportSpreadsheet}><Download size={14} /> Export spreadsheet</Btn>
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
          {isAdmin ? "Admin access" : "View only"}
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
                <div style={{ fontSize: 10, color: C.textMid }}>Username</div>
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
