import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitReceive: () => void;
};

export default function StockReceiveModal({ modal, onClose, setField, submitReceive }: Props) {
  return (
    <Modal title={modal.title ?? "ຮັບເຂົ້າ"} onClose={onClose}>
      <Inp label={`ຈຳນວນ (${modal.data.unit})`} type="number" value={modal.data.qty} onChange={(e) => setField("qty", e.target.value)} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitReceive}>ຢືນຢັນ</Btn>
      </div>
    </Modal>
  );
}
