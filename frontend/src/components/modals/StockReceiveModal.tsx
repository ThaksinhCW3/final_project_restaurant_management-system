import { C, formatCurrencyInput, kip } from "../../config/constants";
import type { SupplierItem } from "../../types";
import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitReceive: () => void;
  suppliers: SupplierItem[];
};

export default function StockReceiveModal({ modal, onClose, setField, submitReceive, suppliers }: Props) {
  const qty = Number(modal.data.qty || 0);
  const cost = Number(String(modal.data.costPrice ?? modal.data.costPerUnit ?? 0).replace(/[^\d.-]/g, ""));
  const total = Number.isFinite(qty * cost) ? qty * cost : 0;

  return (
    <Modal title={modal.title ?? "ຮັບເຂົ້າ"} onClose={onClose} width={620}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <Inp label={`ຈຳນວນ (${modal.data.unit})`} type="number" value={modal.data.qty} onChange={(e) => setField("qty", e.target.value)} />
        <Inp
          label="ລາຄາຕໍ່ຫົວໜ່ວຍ (₭)"
          value={formatCurrencyInput(modal.data.costPrice ?? modal.data.costPerUnit ?? "")}
          onChange={(e) => setField("costPrice", formatCurrencyInput(e.target.value))}
        />
      </div>
      <Sel label="ຜູ້ສະໜອງ" value={modal.data.supplierId ?? ""} onChange={(e) => setField("supplierId", e.target.value)}>
        <option value="">ບໍ່ໄດ້ເລືອກຜູ້ສະໜອງ</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}{supplier.phone ? ` - ${supplier.phone}` : ""}
          </option>
        ))}
      </Sel>
      <Inp label="ໝາຍເຫດ" value={modal.data.remark ?? ""} onChange={(e) => setField("remark", e.target.value)} />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ color: C.textMid, fontSize: 12 }}>ລວມມູນຄ່ານໍາເຂົ້າ</span>
        <strong style={{ color: C.gold }}>{kip(total)}</strong>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitReceive}>ຢືນຢັນ</Btn>
      </div>
    </Modal>
  );
}
