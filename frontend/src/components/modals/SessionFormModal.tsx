import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitSession: () => void;
};

export default function SessionFormModal({ modal, onClose, setField, submitSession }: Props) {
  return (
    <Modal title={modal.title ?? "Bill"} onClose={onClose}>
      <Sel label="ປະເພດເຊດຊັນ" value={modal.data.sessionType} onChange={(e) => setField("sessionType", e.target.value)}>
        <option value="dine-in">ທານທີ່ຮ້ານ</option>
        <option value="takeaway">ກັບບ້ານ</option>
      </Sel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Inp label="ເລກໂຕະ" type="number" value={modal.data.tableNumber} onChange={(e) => setField("tableNumber", e.target.value)} />
        <Inp label="Staff ID" type="number" value={modal.data.staffId} onChange={(e) => setField("staffId", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitSession}>ບັນທຶກ</Btn>
      </div>
    </Modal>
  );
}
