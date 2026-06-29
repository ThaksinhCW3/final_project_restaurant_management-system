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
  const items: any[] = modal.data.items ?? [];

  const setItems = (nextItems: any[]) => setField("items", nextItems);
  const firstStock = stock[0];
  const addCreateRow = () => {
    const ingredient = firstStock;
    setItems([
      ...items,
      {
        ingredientId: ingredient?.id ?? "",
        ingredientName: ingredient?.name ?? "",
        unit: ingredient?.unit ?? "",
        qty: "",
        minQty: 0,
        unitPrice: ingredient?.costPerUnit ? ingredient.costPerUnit.toLocaleString("en-US") : "",
        supplierId: ingredient?.supplierId ?? suppliers[0]?.id ?? "",
        locked: false,
      },
    ]);
  };
  const updateRow = (index: number, field: string, value: any) => {
    const nextItems = [...items];
    const nextItem = { ...nextItems[index], [field]: value };

    if (field === "qty") {
      const nextQty = Number(value);
      nextItem.qty = String(Math.max(0, Number.isFinite(nextQty) ? nextQty : 0));
    }

    if (field === "ingredientId") {
      const ingredient = stock.find((item) => String(item.id) === String(value));
      nextItem.ingredientName = ingredient?.name ?? "";
      nextItem.unit = ingredient?.unit ?? "";
      nextItem.unitPrice = ingredient?.costPerUnit ? ingredient.costPerUnit.toLocaleString("en-US") : "";
      nextItem.supplierId = ingredient?.supplierId ?? nextItem.supplierId ?? suppliers[0]?.id ?? "";
      nextItem.minQty = Number(nextItem.minQty ?? 0);
    }

    nextItems[index] = nextItem;
    setItems(nextItems);
  };
  const removeRow = (index: number) => setItems(items.filter((_: any, i: number) => i !== index));
  const updateRowsSupplier = (indexes: number[], supplierId: string) => {
    setItems(
      items.map((item: any, index: number) =>
        indexes.includes(index) ? { ...item, supplierId } : item,
      ),
    );
  };

  const plannedTotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.qty || 0) * parseMoney(item.unitPrice),
    0,
  );
  const checkedTotal = items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.receivedQuantity || 0) * parseMoney(item.actualUnitPrice),
    0,
  );
  const createLineTotal = (item: any) => Number(item.qty || 0) * parseMoney(item.unitPrice);
  const createBillGroups = items.reduce<
    {
      key: string;
      supplierId: string | number | "";
      supplierName: string;
      supplierPhone?: string | null;
      rows: { item: any; index: number }[];
      total: number;
    }[]
  >((groups, item: any, index: number) => {
    const supplierId = item.supplierId ?? "";
    const supplier = suppliers.find((entry) => String(entry.id) === String(supplierId));
    const key = supplierId ? String(supplierId) : "no-supplier";
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = {
        key,
        supplierId,
        supplierName: supplier?.name ?? "ບໍ່ມີຜູ້ສະໜອງ",
        supplierPhone: supplier?.phone,
        rows: [],
        total: 0,
      };
      groups.push(group);
    }
    group.rows.push({ item, index });
    group.total += createLineTotal(item);
    return groups;
  }, []);

  if (mode === "receive") {
    return (
      <Modal title={modal.title ?? "ກວດສິນຄ້າ"} onClose={onClose} width={980}>
        <div style={{ background: "#fffdf8", border: "1px solid rgba(58,120,184,0.28)", borderRadius: 8, padding: 16, boxShadow: "0 14px 30px rgba(35,10,10,0.06)", color: C.text }}>
          <div style={{ textAlign: "center", color: C.blue, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>ໃບກວດສິນຄ້າ</div>
          <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, marginBottom: 12 }}>RECEIVING BILL</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
            <span>ຜູ້ສະໜອງ: <strong style={{ color: C.text }}>{modal.data.supplierName || "—"}</strong></span>
            <span>ໃບສັ່ງ #{modal.data.orderId}</span>
            <span>ວັນທີ: {new Date().toLocaleDateString()}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 760 }}>
              <div style={{ display: "grid", gridTemplateColumns: "42px minmax(170px,1fr) 100px 124px 124px 120px", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.blue}`, borderBottom: `1px solid ${C.blue}`, color: C.blue, fontSize: 12, fontWeight: 800 }}>
                <span>No.</span>
                <span>ລາຍການ</span>
                <span>ສັ່ງ</span>
                <span>ໄດ້ຮັບຈິງ</span>
                <span>ລາຄາຈິງ</span>
                <span style={{ textAlign: "right" }}>ລວມ</span>
              </div>
              {items.map((item: any, index: number) => {
                const ingredient = stock.find((entry) => entry.id === Number(item.ingredientId));
                const lineTotal = Number(item.receivedQuantity || 0) * parseMoney(item.actualUnitPrice);
                return (
                  <div key={item.detailId ?? index} style={{ display: "grid", gridTemplateColumns: "42px minmax(170px,1fr) 100px 124px 124px 120px", gap: 8, minHeight: 48, alignItems: "center", borderBottom: "1px solid rgba(58,120,184,0.20)", fontSize: 13 }}>
                    <span style={{ color: C.textDim }}>{index + 1}</span>
                    <div>
                      <div style={{ color: C.text, fontWeight: 800 }}>{item.ingredientName}</div>
                      <div style={{ color: C.textDim, fontSize: 11 }}>{kip(item.unitPrice)} / {ingredient?.unit ?? ""}</div>
                    </div>
                    <span style={{ color: C.textDim }}>{item.orderedQuantity} {ingredient?.unit ?? ""}</span>
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 12 }}>
                <span style={{ color: C.textDim, fontWeight: 800 }}>TOTAL</span>
                <strong style={{ color: C.gold, minWidth: 120, textAlign: "right" }}>{kip(checkedTotal)}</strong>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
          <Btn onClick={submitReceive}>ບັນທຶກ</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={modal.title ?? "ສັ່ງຊື້"} onClose={onClose} width={1060}>
      <div style={{ display: "grid", gap: 14 }}>
        {createBillGroups.map((group) => (
          <div key={group.key} style={{ background: "#fffdf8", border: "1px solid rgba(58,120,184,0.28)", borderRadius: 8, padding: 16, boxShadow: "0 14px 30px rgba(35,10,10,0.06)", color: C.text }}>
            <div style={{ textAlign: "center", color: C.blue, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>ໃບສັ່ງຊື້</div>
            <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, marginBottom: 12 }}>PURCHASE ORDER</div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(220px,320px) auto", gap: 10, alignItems: "center", fontSize: 12, color: C.textDim, marginBottom: 12 }}>
              <span>ຜູ້ສະໜອງ: <strong style={{ color: C.text }}>{group.supplierName}</strong></span>
              <select
                value={group.supplierId ?? ""}
                onChange={(e) => updateRowsSupplier(group.rows.map((row) => row.index), e.target.value)}
                style={inputStyle}
              >
                <option value="">ເລືອກຜູ້ສະໜອງ</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}{supplier.phone ? ` - ${supplier.phone}` : ""}
                  </option>
                ))}
              </select>
              <span>ວັນທີ: {new Date().toLocaleDateString()}</span>
              {group.supplierPhone && <span>ໂທ: {group.supplierPhone}</span>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 820 }}>
                <div style={{ display: "grid", gridTemplateColumns: "42px minmax(170px,1fr) 124px 74px 124px 120px 42px", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.blue}`, borderBottom: `1px solid ${C.blue}`, color: C.blue, fontSize: 12, fontWeight: 800 }}>
                  <span>No.</span>
                  <span>ລາຍການ</span>
                  <span>ຈຳນວນ</span>
                  <span>ຫົວໜ່ວຍ</span>
                  <span>ລາຄາ</span>
                  <span style={{ textAlign: "right" }}>ລວມ</span>
                  <span />
                </div>
                {group.rows.map(({ item, index }, rowIndex) => {
                  const ingredient = stock.find((entry) => String(entry.id) === String(item.ingredientId));
                  const minQty = Number(item.minQty ?? 0);
                  return (
                    <div key={`${group.key}-${index}`} style={{ display: "grid", gridTemplateColumns: "42px minmax(170px,1fr) 124px 74px 124px 120px 42px", gap: 8, minHeight: 52, alignItems: "center", borderBottom: "1px solid rgba(58,120,184,0.20)", fontSize: 13 }}>
                      <span style={{ color: C.textDim }}>{rowIndex + 1}</span>
                      {item.locked ? (
                        <div>
                          <div style={{ color: C.text, fontWeight: 800 }}>{item.ingredientName || ingredient?.name || "—"}</div>
                          {minQty > 0 && <div style={{ color: C.textDim, fontSize: 11 }}>ແນະນຳ {minQty} {ingredient?.unit ?? item.unit ?? ""}</div>}
                        </div>
                      ) : (
                        <select value={item.ingredientId ?? ""} onChange={(e) => updateRow(index, "ingredientId", e.target.value)} style={inputStyle}>
                          <option value="">ເລືອກສິນຄ້າ</option>
                          {stock.map((stockItem) => (
                            <option key={stockItem.id} value={stockItem.id}>{stockItem.name}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.qty ?? ""}
                        onChange={(e) => updateRow(index, "qty", e.target.value)}
                        style={inputStyle}
                      />
                      <span style={{ color: C.textDim, fontSize: 13 }}>{ingredient?.unit ?? item.unit ?? "—"}</span>
                      <input value={formatCurrencyInput(item.unitPrice ?? "")} onChange={(e) => updateRow(index, "unitPrice", formatCurrencyInput(e.target.value))} style={inputStyle} />
                      <strong style={{ color: C.gold, textAlign: "right" }}>{kip(createLineTotal(item))}</strong>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={items.length <= 1 || item.locked}
                        style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(208,64,48,0.3)", background: "rgba(208,64,48,0.08)", color: C.red, cursor: items.length <= 1 || item.locked ? "not-allowed" : "pointer", opacity: items.length <= 1 || item.locked ? 0.45 : 1 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 12 }}>
                  <span style={{ color: C.textDim, fontWeight: 800 }}>TOTAL</span>
                  <strong style={{ color: C.gold, minWidth: 120, textAlign: "right" }}>{kip(group.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
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
          {isAdmin ? "ບັນທຶກ" : "Admin only"}
        </Btn>
      </div>
    </Modal>
  );
}
