import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal } from "../SharedUI";

type Props = {
  modal: NonNullable<AppModalState>;
  onClose: () => void;
  setField: (field: string, value: any) => void;
  submitCategory: () => void;
};

export default function CategoryFormModal({
  modal,
  onClose,
  setField,
  submitCategory,
}: Props) {
  return (
    <Modal title={modal.title ?? "ໝວດເມນູ"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitCategory();
        }}
      >
        <Inp
          autoFocus
          label="ຊື່ໝວດ"
          value={modal.data.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn type="button" variant="secondary" onClick={onClose}>
            ຍົກເລີກ
          </Btn>
          <Btn type="submit">ບັນທຶກ</Btn>
        </div>
      </form>
    </Modal>
  );
}
