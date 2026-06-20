import type { AppModalState } from "../../types/app";
import type { TableItem } from "../../types";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  tables: TableItem[];
  currentUser?: {
    id: number;
    name: string;
    role: string;
    username?: string | null;
  } | null;
  submitSession: () => void;
};

export default function SessionFormModal({ modal, onClose, setField, tables, currentUser, submitSession }: Props) {
  const isDineIn = modal.data.sessionType !== "takeaway";
  const currentTableNumber = Number(modal.data.tableNumber);
  const availableTables = tables.filter(
    (table) => table.status === "free" || table.id === currentTableNumber,
  );

  return (
    <Modal title={modal.title ?? "ບິນ"} onClose={onClose}>
      <Sel label="ປະເພດເຊດຊັນ" value={modal.data.sessionType} onChange={(e) => setField("sessionType", e.target.value)}>
        <option value="dine-in">ທານທີ່ຮ້ານ</option>
        <option value="takeaway">ກັບບ້ານ</option>
      </Sel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {isDineIn ? (
          <Sel
            label="ເລກໂຕະ"
            value={modal.data.tableNumber ?? ""}
            onChange={(e) => setField("tableNumber", e.target.value)}
          >
            <option value="">ເລືອກໂຕະ</option>
            {availableTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name} · {table.seats} ບ່ອນນັ່ງ
              </option>
            ))}
          </Sel>
        ) : (
          <Inp label="ໝາຍເຫດ" value={modal.data.note ?? ""} onChange={(e) => setField("note", e.target.value)} placeholder="ບໍ່ບັງຄັບ" />
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#7e1a1a", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
            ພະນັກງານ
          </div>
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#f8f4f4",
              border: "1px solid rgba(181, 28, 28, 0.1)",
              borderRadius: 9,
              padding: "9px 12px",
              color: "#121212",
              fontSize: 13,
              minHeight: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span>{currentUser?.name ?? "ຜູ້ໃຊ້ປັດຈຸບັນ"}</span>
            <strong style={{ color: "#7e1a1a", fontSize: 12 }}>#{currentUser?.id ?? modal.data.staffId ?? "-"}</strong>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitSession}>ບັນທຶກ</Btn>
      </div>
    </Modal>
  );
}
