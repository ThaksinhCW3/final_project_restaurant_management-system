import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitStaff: () => void;
};

export default function StaffFormModal({ modal, onClose, setField, submitStaff }: Props) {
  const editing = Boolean(modal.data.id);

  return (
    <Modal title={modal.title ?? "ພະນັກງານ"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Inp label="ຊື່" value={modal.data.name} onChange={(e) => setField("name", e.target.value)} />
        <Inp label="Emoji" value={modal.data.emoji} onChange={(e) => setField("emoji", e.target.value)} />
        <Sel label="ຕໍາແໜ່ງ" value={modal.data.role} onChange={(e) => setField("role", e.target.value)}>
          <option value="employee">Staff</option>
          <option value="manager">Admin</option>
        </Sel>
        <Inp label="Phone" value={modal.data.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} />
        <Inp label="Username" value={modal.data.username ?? ""} onChange={(e) => setField("username", e.target.value)} />
        <Inp
          label={editing ? "New password" : "Password"}
          type="password"
          autoComplete="new-password"
          value={modal.data.password ?? ""}
          onChange={(e) => setField("password", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>ຍົກເລີກ</Btn>
        <Btn onClick={submitStaff}>ບັນທຶກ</Btn>
      </div>
    </Modal>
  );
}
