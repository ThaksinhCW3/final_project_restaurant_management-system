import { useId } from "react";
import { CloudUpload } from "lucide-react";
import { C, formatCurrencyInput } from "../../config/constants";
import type { SupplierItem } from "../../types";
import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  handleImageUpload: (file: File | null, field?: string) => Promise<void>;
  submitStock: () => void;
  suppliers: SupplierItem[];
};

export default function StockFormModal({ modal, onClose, setField, handleImageUpload, submitStock, suppliers }: Props) {
  const imageInputId = useId();
  const selectedSupplier = suppliers.find((supplier) => String(supplier.id) === String(modal.data.supplierId ?? ""));

  return (
    <Modal title={modal.title ?? "ສິນຄ້າ"} onClose={onClose} width={760}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.95fr) minmax(260px, 1fr)", gap: 22, alignItems: "start" }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>ຮູບ</div>
            <label
              className={`image-upload-zone${modal.data.image ? " image-upload-zone--has-image" : ""}`}
              htmlFor={imageInputId}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleImageUpload(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                id={imageInputId}
                className="image-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  void handleImageUpload(e.currentTarget.files?.[0] ?? null);
                  e.currentTarget.value = "";
                }}
              />
              {modal.data.image ? (
                <img className="image-upload-preview" src={modal.data.image} alt="ຕົວຢ່າງຮູບວັດຖຸດິບ" />
              ) : (
                <span className="image-upload-empty" />
              )}
              <span className="image-upload-overlay">
                <CloudUpload size={38} strokeWidth={1.8} />
                <span className="image-upload-title">ອັບໂຫຼດຮູບ</span>
                <span className="image-upload-text">ລາກໄຟລ໌ມາວາງ</span>
              </span>
            </label>
            {modal.data.image && (
              <div className="image-upload-actions">
                <button
                  type="button"
                  className="image-upload-remove"
                  onClick={() => setField("image", "")}
                  aria-label="ລຶບຮູບ"
                  title="ລຶບຮູບ"
                >
                  X
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Inp label="ຊື່" value={modal.data.name} onChange={(e) => setField("name", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Sel label="ຫົວໜ່ວຍ" value={modal.data.unit || "kg"} onChange={(e) => setField("unit", e.target.value)}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="pcs">pcs</option>
            </Sel>
            <Inp label="ຈຳນວນ" type="number" value={modal.data.cur} onChange={(e) => setField("cur", e.target.value)} />
            <Inp label="ຈຳນວນຕ່ຳສຸດ" type="number" value={modal.data.min} onChange={(e) => setField("min", e.target.value)} />
            <Inp
              label="ລາຄາຕໍ່ຫົວໜ່ວຍ (₭)"
              value={modal.data.costPerUnit ?? ""}
              onChange={(e) => setField("costPerUnit", formatCurrencyInput(e.target.value))}
            />
          </div>
          <Sel
            label="ຜູ້ສະໜອງ"
            value={modal.data.supplierId ?? ""}
            onChange={(e) => setField("supplierId", e.target.value)}
          >
            <option value="">ບໍ່ໄດ້ເລືອກຜູ້ສະໜອງ</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}{supplier.phone ? ` - ${supplier.phone}` : ""}
              </option>
            ))}
          </Sel>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, color: C.textDim, fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ color: C.textMid, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
              ລາຍລະອຽດຜູ້ສະໜອງ
            </div>
            {selectedSupplier ? (
              <>
                <div>{selectedSupplier.name}</div>
                {selectedSupplier.phone && <div>{selectedSupplier.phone}</div>}
                {selectedSupplier.address && <div>{selectedSupplier.address}</div>}
              </>
            ) : (
              <div>ບໍ່ມີຜູ້ສະໜອງ</div>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitStock}>ບັນທຶກ</Btn>
      </div>
    </Modal>
  );
}
