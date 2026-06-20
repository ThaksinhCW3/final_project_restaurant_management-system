import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SupplierItem } from "../../types";
import type { AppModalState } from "../../types/app";
import { C } from "../../config/constants";
import { Btn, Inp, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  suppliers: SupplierItem[];
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitSupplier: () => void;
  editSupplier: (supplier: SupplierItem) => void;
  deleteSupplier: (supplier: SupplierItem) => void;
};

export default function SupplierManagerModal({
  modal,
  suppliers,
  onClose,
  setField,
  submitSupplier,
  editSupplier,
  deleteSupplier,
}: Props) {
  const editing = Boolean(modal.data.id);

  return (
    <Modal title={modal.title ?? "ຜູ້ສະໜອງ"} onClose={onClose} width={780}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) minmax(300px, 1fr)", gap: 18 }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ color: C.textMid, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 }}>
              {editing ? "ແກ້ໄຂຜູ້ສະໜອງ" : "ເພີ່ມຜູ້ສະໜອງ"}
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setField("id", undefined);
                  setField("name", "");
                  setField("phone", "");
                }}
                style={{ border: `1px solid ${C.border}`, background: "transparent", borderRadius: 9, color: C.textMid, padding: "7px 10px", cursor: "pointer" }}
              >
                <Plus size={13} /> ໃໝ່
              </button>
            )}
          </div>
          <Inp label="ຊື່ຜູ້ສະໜອງ" value={modal.data.name ?? ""} onChange={(e) => setField("name", e.target.value)} />
          <Inp label="ເບີໂທ" value={modal.data.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={submitSupplier}>{editing ? "ບັນທຶກ" : "ເພີ່ມ"}</Btn>
          </div>
        </div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 }}>
            ລາຍຊື່ຜູ້ສະໜອງ
          </div>
          <div style={{ maxHeight: 360, overflow: "auto" }}>
            {suppliers.map((supplier) => (
              <div key={supplier.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 14px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 650, fontSize: 13 }}>{supplier.name}</div>
                  <div style={{ color: C.textDim, fontSize: 11, marginTop: 3 }}>
                    {supplier.phone || "ບໍ່ມີເບີໂທ"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => editSupplier(supplier)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, cursor: "pointer" }} title="ແກ້ໄຂຜູ້ສະໜອງ">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => deleteSupplier(supplier)} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(208,64,48,0.3)", background: "rgba(208,64,48,0.08)", color: C.red, cursor: "pointer" }} title="ລຶບຜູ້ສະໜອງ">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div style={{ padding: 18, color: C.textDim, fontSize: 13 }}>ຍັງບໍ່ມີຜູ້ສະໜອງ</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
