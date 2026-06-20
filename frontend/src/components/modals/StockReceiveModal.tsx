import { Plus, Trash2 } from "lucide-react";
import { C, formatCurrencyInput, kip } from "../../config/constants";
import type { StockItem, SupplierItem } from "../../types";
import type { AppModalState } from "../../types/app";
import { Btn, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitReceive: () => void;
  suppliers: SupplierItem[];
  stock: StockItem[];
  isAdmin: boolean;
};

const parseMoney = (value: unknown) =>
  Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;

const inputStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box" as const,
  background: C.card2,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: "9px 10px",
  color: C.text,
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--sans)",
};

export default function StockReceiveModal({
  modal,
  onClose,
  setField,
  submitReceive,
  suppliers,
  stock,
  isAdmin,
}: Props) {
  const mode = modal.data.mode ?? "create";
  const items = modal.data.items ?? [];

  const setItems = (nextItems: any[]) => setField("items", nextItems);
  const firstStock = stock[0];
  const addCreateRow = () => {
    const ingredient = firstStock;
    setItems([
      ...items,
      {
        ingredientId: ingredient?.id ?? "",
        qty: "",
        unitPrice: ingredient?.costPerUnit ? ingredient.costPerUnit.toLocaleString("en-US") : "",
        supplierId: ingredient?.supplierId ?? suppliers[0]?.id ?? "",
      },
    ]);
  };
  const updateRow = (index: number, field: string, value: any) => {
    const nextItems = [...items];
    const nextItem = { ...nextItems[index], [field]: value };

    if (field === "ingredientId") {
      const ingredient = stock.find((item) => String(item.id) === String(value));
      nextItem.unitPrice = ingredient?.costPerUnit ? ingredient.costPerUnit.toLocaleString("en-US") : "";
      nextItem.supplierId = ingredient?.supplierId ?? nextItem.supplierId ?? suppliers[0]?.id ?? "";
    }

    nextItems[index] = nextItem;
    setItems(nextItems);
  };
  const removeRow = (index: number) => setItems(items.filter((_: any, i: number) => i !== index));

  const plannedTotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.qty || 0) * parseMoney(item.unitPrice),
    0,
  );
  const checkedTotal = items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.receivedQuantity || 0) * parseMoney(item.actualUnitPrice),
    0,
  );

  if (mode === "receive") {
    return (
      <Modal title={modal.title ?? "ກວດສິນຄ້າ"} onClose={onClose} width={920}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 96px 110px 110px 128px", gap: 10, color: C.textMid, fontSize: 11, textTransform: "uppercase" }}>
            <span>ສິນຄ້າ</span>
            <span>ສັ່ງ</span>
            <span>ຮັບຈິງ</span>
            <span>ລາຄາຈິງ</span>
            <span>ລວມ</span>
          </div>
          {items.map((item: any, index: number) => {
            const ingredient = stock.find((entry) => entry.id === Number(item.ingredientId));
            const lineTotal = Number(item.receivedQuantity || 0) * parseMoney(item.actualUnitPrice);
            return (
              <div key={item.detailId ?? index} style={{ display: "grid", gridTemplateColumns: "1fr 96px 110px 110px 128px", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{item.ingredientName}</div>
                  <div style={{ color: C.textDim, fontSize: 11 }}>
                    {kip(item.unitPrice)} / {ingredient?.unit ?? ""}
                  </div>
                </div>
                <div style={{ color: C.textDim, fontSize: 13 }}>
                  {item.orderedQuantity} {ingredient?.unit ?? ""}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.receivedQuantity}
                  onChange={(e) => updateRow(index, "receivedQuantity", e.target.value)}
                  style={inputStyle}
                />
                <input
                  value={formatCurrencyInput(item.actualUnitPrice ?? "")}
                  onChange={(e) => updateRow(index, "actualUnitPrice", formatCurrencyInput(e.target.value))}
                  style={inputStyle}
                />
                <strong style={{ color: C.gold, textAlign: "right" }}>{kip(lineTotal)}</strong>
              </div>
            );
          })}
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", margin: "16px 0", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: C.textMid, fontSize: 12 }}>ລວມຕາມທີ່ກວດແລ້ວ</span>
          <strong style={{ color: C.gold }}>{kip(checkedTotal)}</strong>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
          <Btn onClick={submitReceive}>ກວດແລ້ວ ເພີ່ມເຂົ້າຄັງ</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={modal.title ?? "ຮັບເຂົ້າ"} onClose={onClose} width={960}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 84px 110px 1fr 42px", gap: 10, color: C.textMid, fontSize: 11, textTransform: "uppercase" }}>
          <span>ສິນຄ້າ</span>
          <span>ຈຳນວນ</span>
          <span>ຫົວໜ່ວຍ</span>
          <span>ລາຄາ</span>
          <span>ຜູ້ສະໜອງ</span>
          <span />
        </div>
        {items.map((item: any, index: number) => {
          const ingredient = stock.find((entry) => String(entry.id) === String(item.ingredientId));
          return (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 84px 110px 1fr 42px", gap: 10, alignItems: "center" }}>
              <select value={item.ingredientId ?? ""} onChange={(e) => updateRow(index, "ingredientId", e.target.value)} style={inputStyle}>
                <option value="">ເລືອກສິນຄ້າ</option>
                {stock.map((stockItem) => (
                  <option key={stockItem.id} value={stockItem.id}>{stockItem.name}</option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" value={item.qty ?? ""} onChange={(e) => updateRow(index, "qty", e.target.value)} style={inputStyle} />
              <span style={{ color: C.textDim, fontSize: 13 }}>{ingredient?.unit ?? "—"}</span>
              <input value={formatCurrencyInput(item.unitPrice ?? "")} onChange={(e) => updateRow(index, "unitPrice", formatCurrencyInput(e.target.value))} style={inputStyle} />
              <select value={item.supplierId ?? ""} onChange={(e) => updateRow(index, "supplierId", e.target.value)} style={inputStyle}>
                <option value="">ເລືອກ</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}{supplier.phone ? ` - ${supplier.phone}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={items.length <= 1}
                style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(208,64,48,0.3)", background: "rgba(208,64,48,0.08)", color: C.red, cursor: items.length <= 1 ? "not-allowed" : "pointer", opacity: items.length <= 1 ? 0.45 : 1 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addCreateRow}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: `1px dashed ${C.borderMid}`, background: C.card2, color: C.text, cursor: "pointer", fontWeight: 700 }}
        >
          <Plus size={14} /> ເພີ່ມລາຍການຕໍ່ໄປ
        </button>
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", margin: "16px 0", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ color: C.textMid, fontSize: 12 }}>ລວມມູນຄ່າທີ່ຈະສັ່ງ</span>
        <strong style={{ color: C.gold }}>{kip(plannedTotal)}</strong>
      </div>
      {!isAdmin && (
        <div style={{ color: C.red, background: "rgba(208,64,48,0.08)", border: "1px solid rgba(208,64,48,0.18)", borderRadius: 12, padding: "10px 12px", marginBottom: 14, fontSize: 12 }}>
          ຕ້ອງໃຫ້ admin ຢືນຢັນລາຍການນີ້
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitReceive} disabled={!isAdmin}>
          {isAdmin ? "Admin confirm" : "Admin only"}
        </Btn>
      </div>
    </Modal>
  );
}
