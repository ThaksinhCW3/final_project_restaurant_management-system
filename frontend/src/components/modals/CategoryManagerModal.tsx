import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AppModalState } from "../../types/app";
import { Btn, Modal } from "../SharedUI";

type CategoryItem = {
  id?: number;
  category_id?: number;
  categoryId?: number;
  name?: string;
  category_name?: string;
  categoryName?: string;
};

type Props = {
  modal: NonNullable<AppModalState>;
  categories: CategoryItem[];
  onClose: () => void;
  openAddCategory: () => void;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number, name: string) => Promise<void>;
};

const getCategoryId = (category: CategoryItem) =>
  Number(category.category_id ?? category.categoryId ?? category.id);

const getCategoryName = (category: CategoryItem) =>
  String(category.category_name ?? category.categoryName ?? category.name ?? "");

export default function CategoryManagerModal({
  modal,
  categories,
  onClose,
  openAddCategory,
  updateCategory,
  deleteCategory,
}: Props) {
  const [names, setNames] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const nextNames: Record<number, string> = {};
    categories.forEach((category) => {
      const id = getCategoryId(category);
      if (Number.isFinite(id)) {
        nextNames[id] = getCategoryName(category);
      }
    });
    setNames(nextNames);
  }, [categories]);

  return (
    <Modal title={modal.title ?? "ໝວດເມນູ"} onClose={onClose} width={560}>
      <div className="category-manager">
        <div className="category-manager-head">
          <div>
            <span>Categories</span>
            <small>{categories.length} ລາຍການ</small>
          </div>
          <button type="button" onClick={openAddCategory}>
            <Plus size={14} /> ເພີ່ມ
          </button>
        </div>

        <div className="category-manager-list">
          {categories.map((category) => {
            const id = getCategoryId(category);
            const originalName = getCategoryName(category);
            const name = names[id] ?? originalName;
            const changed = name.trim() !== originalName.trim();
            const busy = busyId === id;

            return (
              <div className="category-manager-row" key={id}>
                <input
                  value={name}
                  disabled={busy}
                  onChange={(event) =>
                    setNames((current) => ({ ...current, [id]: event.target.value }))
                  }
                />
                <Btn
                  type="button"
                  variant="secondary"
                  disabled={!changed || !name.trim() || busy}
                  onClick={async () => {
                    setBusyId(id);
                    try {
                      await updateCategory(id, name.trim());
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  ບັນທຶກ
                </Btn>
                <button
                  type="button"
                  disabled={busy}
                  className="category-manager-delete"
                  onClick={async () => {
                    setBusyId(id);
                    try {
                      await deleteCategory(id, originalName);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  aria-label={`ລຶບ ${originalName}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="category-manager-empty">ຍັງບໍ່ມີໝວດ</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
