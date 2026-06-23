import { AlertTriangle } from "lucide-react";
import { C } from "../../config/constants";
import type { AppModalState } from "../../types/app";
import { Btn, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
};

export default function ConfirmModal({ modal, onClose }: Props) {
  const cancel = modal.onCancel ?? onClose;

  return (
    <Modal title={modal.title ?? "ຢືນຢັນ"} onClose={cancel}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "10px 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(208,64,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={22} color={C.red} />
        </div>
        <p style={{ fontSize: 14, color: C.textMid, textAlign: "center", margin: 0, lineHeight: 1.6 }}>{modal.msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={cancel}>ຍົກເລີກ</Btn>
          <Btn variant="danger" onClick={modal.onConfirm ?? onClose}>ຢືນຢັນ</Btn>
        </div>
      </div>
    </Modal>
  );
}
