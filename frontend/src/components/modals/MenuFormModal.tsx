import { useId, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  CloudUpload,
  Crop as CropIcon,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { C, formatCurrencyInput } from "../../config/constants";
import type { IngredientItem } from "../../types";
import type { AppModalState } from "../../types/app";
import { Btn, Inp, Modal, Sel } from "../SharedUI";

type ModalState = NonNullable<AppModalState>;

type Props = {
  modal: ModalState;
  categories: any[];
  ingredients: IngredientItem[];
  onClose: () => void;
  setField: (field: string, value: any) => void;
  addMenuRecipeRow: (ingredientId?: number | string) => void;
  setMenuRecipeField: (index: number, field: string, value: any) => void;
  removeMenuRecipeRow: (index: number) => void;
  addMenuOptionGroup: () => void;
  setMenuOptionGroupField: (
    groupIndex: number,
    field: string,
    value: any,
  ) => void;
  removeMenuOptionGroup: (groupIndex: number) => void;
  addMenuOptionValue: (groupIndex: number) => void;
  setMenuOptionValueField: (
    groupIndex: number,
    valueIndex: number,
    field: string,
    value: any,
  ) => void;
  removeMenuOptionValue: (groupIndex: number, valueIndex: number) => void;
  submitMenu: () => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read image"));
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });

const createCroppedImage = (imageSrc: string, cropPixels: Area) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(cropPixels.width));
      canvas.height = Math.max(1, Math.round(cropPixels.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not available"));
        return;
      }
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });

export default function MenuFormModal({
  modal,
  categories,
  ingredients,
  onClose,
  setField,
  addMenuRecipeRow,
  setMenuRecipeField,
  removeMenuRecipeRow,
  addMenuOptionGroup,
  setMenuOptionGroupField,
  removeMenuOptionGroup,
  addMenuOptionValue,
  setMenuOptionValueField,
  removeMenuOptionValue,
  submitMenu,
}: Props) {
  const imageInputId = useId();
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const cropSettings = modal.data.cropSettings;
  const selectedIngredientIds = new Set(
    (modal.data.recipeItems ?? []).map((recipe: any) =>
      Number(recipe.ingredientId),
    ),
  );

  const openCropper = () => {
    setCropImage(originalImage);
    setCrop(cropSettings?.crop ?? { x: 0, y: 0 });
    setZoom(cropSettings?.zoom ?? 1);
    setCroppedAreaPixels(cropSettings?.croppedAreaPixels ?? null);
  };

  const uploadImage = async (file?: File | null) => {
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setField("originalImage", image);
    setField("image", image);
    setField("cropSettings", null);
    setCropImage(image);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const applyCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const croppedImage = await createCroppedImage(cropImage, croppedAreaPixels);
    setField("image", croppedImage);
    setField("cropSettings", { crop, zoom, croppedAreaPixels });
    setCropImage("");
  };

  const originalImage = modal.data.originalImage || modal.data.image || "";
  const canResetImage = Boolean(
    originalImage && modal.data.image && originalImage !== modal.data.image,
  );
  const selectedCategoryId = (() => {
    if (modal.data.categoryId != null && modal.data.categoryId !== "") {
      return String(modal.data.categoryId);
    }
    const currentCategory = categories.find((category) => {
      const name =
        category.category_name ?? category.categoryName ?? category.name;
      return name === modal.data.cat;
    });
    const id =
      currentCategory?.category_id ??
      currentCategory?.id ??
      currentCategory?.categoryId;
    return id == null ? "" : String(id);
  })();

  return (
    <Modal title={modal.title ?? "ເມນູ"} onClose={onClose} width={860}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 0.95fr) minmax(320px, 1.05fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                color: C.textMid,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              ຮູບ
            </div>
            <label
              className={`image-upload-zone${modal.data.image ? " image-upload-zone--has-image" : ""}`}
              htmlFor={imageInputId}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadImage(e.dataTransfer.files?.[0]);
              }}
            >
              <input
                id={imageInputId}
                className="image-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  void uploadImage(e.currentTarget.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              {modal.data.image ? (
                <img
                  className="image-upload-preview"
                  src={modal.data.image}
                  alt="ຕົວຢ່າງຮູບເມນູ"
                />
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
                  className="image-upload-crop"
                  onClick={openCropper}
                >
                  <CropIcon size={14} />
                  ຕັດຮູບ
                </button>
                {canResetImage && (
                  <button
                    type="button"
                    className="image-upload-original"
                    onClick={() => {
                      setField("image", originalImage);
                      setField("cropSettings", null);
                    }}
                  >
                    <RotateCcw size={14} />
                    ຮູບຕົ້ນສະບັບ
                  </button>
                )}
                <button
                  type="button"
                  className="image-upload-remove"
                  onClick={() => {
                    setField("image", "");
                    setField("originalImage", "");
                    setCropImage("");
                  }}
                  aria-label="ລຶບຮູບ"
                  title="ລຶບຮູບ"
                >
                  X
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textMid,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                }}
              >
                ວັດຖຸດິບທີ່ໃຊ້
              </div>
              <button
                type="button"
                onClick={() => setShowIngredientPicker(true)}
                disabled={ingredients.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  cursor: ingredients.length === 0 ? "not-allowed" : "pointer",
                  opacity: ingredients.length === 0 ? 0.55 : 1,
                }}
              >
                <Plus size={14} /> ເພີ່ມ
              </button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(modal.data.recipeItems ?? []).map(
                (recipe: any, index: number) => {
                  const ingredient = ingredients.find(
                    (item) => item.id === Number(recipe.ingredientId),
                  );
                  return (
                    <div
                      key={recipe.id ?? index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) 86px 44px 38px",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={recipe.ingredientId}
                        onChange={(e) =>
                          setMenuRecipeField(
                            index,
                            "ingredientId",
                            e.target.value,
                          )
                        }
                        style={{
                          width: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          background: C.card2,
                          border: `1px solid ${C.border}`,
                          borderRadius: 9,
                          padding: "9px 10px",
                          color: C.text,
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "var(--sans)",
                        }}
                      >
                        {ingredients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={recipe.quantityUsed}
                        onChange={(e) =>
                          setMenuRecipeField(
                            index,
                            "quantityUsed",
                            e.target.value,
                          )
                        }
                        placeholder="qty"
                        style={{
                          width: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          background: C.card2,
                          border: `1px solid ${C.border}`,
                          borderRadius: 9,
                          padding: "9px 10px",
                          color: C.text,
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "var(--sans)",
                        }}
                      />
                      <span
                        style={{
                          color: C.textMid,
                          fontSize: 13,
                          fontWeight: 700,
                          textTransform: "lowercase",
                        }}
                      >
                        {ingredient?.unit ?? "-"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMenuRecipeRow(index)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          border: "1px solid rgba(208,64,48,0.3)",
                          background: "rgba(208,64,48,0.08)",
                          color: C.red,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                },
              )}
              {(modal.data.recipeItems ?? []).length === 0 && (
                <div
                  style={{
                    border: `1px dashed ${C.borderMid}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: C.textDim,
                    fontSize: 13,
                  }}
                >
                  ຍັງບໍ່ໄດ້ເລືອກວັດຖຸດິບ
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Inp
              label="ຊື່"
              value={modal.data.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <Inp
              label="ລາຄາ (₭)"
              inputMode="numeric"
              value={formatCurrencyInput(modal.data.price)}
              onChange={(e) =>
                setField("price", formatCurrencyInput(e.target.value))
              }
            />
          </div>
          <Sel
            label="ໝວດ"
            value={selectedCategoryId}
            onChange={(e) => {
              const category = categories.find(
                (c) =>
                  String(c.category_id ?? c.id ?? c.categoryId) ===
                  e.target.value,
              );
              setField(
                "categoryId",
                e.target.value ? Number(e.target.value) : null,
              );
              setField(
                "cat",
                category?.category_name ??
                  category?.categoryName ??
                  category?.name ??
                  "",
              );
            }}
          >
            {categories.map((c) => {
              const categoryId = c.category_id ?? c.id ?? c.categoryId;
              const categoryName = c.category_name ?? c.categoryName ?? c.name;
              return (
                <option
                  key={`${categoryId}-${categoryName}`}
                  value={categoryId}
                >
                  {categoryName}
                </option>
              );
            })}
          </Sel>

          <div className="menu-options-panel">
            <div className="menu-options-header">
              <div>
                <span>ຕັ້ງຄ່າຕົວເລືອກ</span>
                <small>ຕົວເລືອກເມນູ</small>
              </div>
              <button type="button" onClick={addMenuOptionGroup}>
                <Plus size={14} /> ເພີ່ມ
              </button>
            </div>

            <div className="menu-options-list">
              {(modal.data.optionGroups ?? []).map(
                (group: any, groupIndex: number) => (
                  <div
                    className="menu-option-group"
                    key={group.id ?? groupIndex}
                  >
                    <div className="menu-option-group-grid">
                      <input
                        value={group.name}
                        onChange={(e) =>
                          setMenuOptionGroupField(
                            groupIndex,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="ຊື່ຕົວເລືອກ ເຊັ່ນ ຂະໜາດ"
                      />
                      <select
                        value={group.selectionType ?? "single"}
                        onChange={(e) =>
                          setMenuOptionGroupField(
                            groupIndex,
                            "selectionType",
                            e.target.value,
                          )
                        }
                      >
                        <option value="single">ເລືອກຢ່າງດຽວ</option>
                        <option value="multiple">ເລືອກໄດ້ຫຼາຍ</option>
                      </select>
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(group.required)}
                          onChange={(e) =>
                            setMenuOptionGroupField(
                              groupIndex,
                              "required",
                              e.target.checked,
                            )
                          }
                        />
                        ຈໍາເປັນ
                      </label>
                      <button
                        type="button"
                        onClick={() => removeMenuOptionGroup(groupIndex)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="menu-option-values">
                      {(group.values ?? []).map(
                        (value: any, valueIndex: number) => (
                          <div
                            className="menu-option-value-row"
                            key={value.id ?? valueIndex}
                          >
                            <input
                              value={value.name}
                              onChange={(e) =>
                                setMenuOptionValueField(
                                  groupIndex,
                                  valueIndex,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="ຄ່າ ເຊັ່ນ ໃຫຍ່"
                            />
                            <input
                              inputMode="numeric"
                              value={formatCurrencyInput(value.priceDelta)}
                              onChange={(e) =>
                                setMenuOptionValueField(
                                  groupIndex,
                                  valueIndex,
                                  "priceDelta",
                                  formatCurrencyInput(e.target.value),
                                )
                              }
                              placeholder="+ ₭"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeMenuOptionValue(groupIndex, valueIndex)
                              }
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ),
                      )}
                      <button
                        type="button"
                        className="menu-option-add-value"
                        onClick={() => addMenuOptionValue(groupIndex)}
                      >
                        <Plus size={13} /> ເພີ່ມຄ່າ
                      </button>
                    </div>
                  </div>
                ),
              )}

              {(modal.data.optionGroups ?? []).length === 0 && (
                <div className="menu-options-empty">ຍັງບໍ່ມີ option</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>
          ຍົກເລີກ
        </Btn>
        <Btn onClick={submitMenu}>ບັນທຶກ</Btn>
      </div>

      {cropImage && (
        <div className="image-crop-modal" onClick={() => setCropImage("")}>
          <div
            className="image-crop-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-crop-header">
              <span>ຕັດຮູບ</span>
              <button type="button" onClick={() => setCropImage("")}>
                X
              </button>
            </div>
            <div className="image-crop-stage">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_croppedArea: Area, croppedPixels: Area) =>
                  setCroppedAreaPixels(croppedPixels)
                }
              />
            </div>
            <div className="image-crop-controls">
              <label className="image-crop-zoom">
                <span>ຂະຫຍາຍ</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </label>
              <div className="image-crop-actions">
                <Btn variant="secondary" onClick={() => setCropImage("")}>
                  ຍົກເລີກ
                </Btn>
                <Btn onClick={() => void applyCrop()}>ນໍາໃຊ້ການຕັດຮູບ</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIngredientPicker && (
        <div
          className="ingredient-picker-modal"
          onClick={() => setShowIngredientPicker(false)}
        >
          <div
            className="ingredient-picker-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ingredient-picker-header">
              <span>ເລືອກວັດຖຸດິບ</span>
              <button
                type="button"
                onClick={() => setShowIngredientPicker(false)}
              >
                X
              </button>
            </div>
            <div className="ingredient-picker-list">
              {ingredients.map((ingredient) => {
                const isSelected = selectedIngredientIds.has(
                  Number(ingredient.id),
                );
                return (
                  <button
                    type="button"
                    key={ingredient.id}
                    className="ingredient-picker-item"
                    disabled={isSelected}
                    onClick={() => {
                      addMenuRecipeRow(ingredient.id);
                      setShowIngredientPicker(false);
                    }}
                  >
                    <span>
                      <strong>{ingredient.name}</strong>
                      <small>{ingredient.unit}</small>
                    </span>
                    <span>{isSelected ? "ເລືອກແລ້ວ" : "ເພີ່ມ"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
