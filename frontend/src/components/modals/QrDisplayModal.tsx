import { ExternalLink } from "lucide-react";
import { BILL_URL, C, QR_URL } from "../../config/constants";
import type { AppModalState } from "../../types/app";
import { Btn, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
};

export default function QrDisplayModal({ modal, onClose }: Props) {
  const openCustomerView = () => {
    window.open(BILL_URL(modal.data.id), "_blank", "noopener,noreferrer");
  };

  return (
    <Modal title={modal.title ?? "ບິນ QR"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ background: C.card2, borderRadius: 16, padding: 18 }}>
          <img src={QR_URL(modal.data.id)} width={160} height={160} alt={modal.data.id} style={{ display: "block", borderRadius: 14 }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{modal.data.id}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{modal.data.createdAt}</div>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <Btn onClick={openCustomerView}><ExternalLink size={14} /> ໜ້າລູກຄ້າ</Btn>
          <Btn variant="secondary" onClick={onClose}>ປິດ</Btn>
          <Btn onClick={onClose}>ບັນທຶກ</Btn>
        </div>
      </div>
    </Modal>
  );
}
