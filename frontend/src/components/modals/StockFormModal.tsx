import { C } from "../../config/constants";
import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  handleImageUpload: (file: File | null, field?: string) => Promise<void>;
  submitStock: () => void;
};

export default function StockFormModal({ modal, onClose, setField, handleImageUpload, submitStock }: Props) {
  return (
    <Modal title={modal.title ?? "ສິນຄ້າ"} onClose={onClose}>
      <Inp label="ຊື່" value={modal.data.name} onChange={(e) => setField("name", e.target.value)} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Image</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void handleImageUpload(e.currentTarget.files?.[0] ?? null)}
          style={{ width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "var(--sans)" }}
        />
        {modal.data.image ? (
          <div style={{ marginTop: 10, height: 140, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, background: C.card2 }}>
            <img src={modal.data.image} alt="Ingredient preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Inp label="ຫົວໜ່ວຍ" value={modal.data.unit} onChange={(e) => setField("unit", e.target.value)} />
        <Inp label="ຈຳນວນ" type="number" value={modal.data.cur} onChange={(e) => setField("cur", e.target.value)} />
        <Inp label="ຫຼັກ" type="number" value={modal.data.min} onChange={(e) => setField("min", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitStock}>ບັນທຶກ</Btn>
      </div>
    </Modal>
  );
}
