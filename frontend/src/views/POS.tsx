// src/views/POS.tsx
import { useState, type FormEvent } from "react";
import { Check, CreditCard, ExternalLink, Minus, Pencil, Plus, QrCode, Trash2, X } from "lucide-react";
import { BILL_URL, C, kip, parseCurrency } from "../config/constants";
import type { MenuItem, MenuOptionGroup, MenuOptionValue, SessionItem, TableItem } from "../types";

const sessionTotal = (session: SessionItem, menu: MenuItem[]): number =>
  session.items.reduce((sum, item) => {
    const menuItem = menu.find(entry => entry.id === item.id);
    return sum + (menuItem ? menuItem.price * item.qty : 0);
  }, 0);

type SelectedOptions = Record<string, Array<string | number>>;

const optionKey = (group: MenuOptionGroup) => String(group.id ?? group.name);
const optionValueKey = (value: MenuOptionValue) => value.id ?? value.name;
const optionPriceDelta = (value: MenuOptionValue) => parseCurrency(value.priceDelta || 0);
const parseOptionTokens = (optionPart: string) =>
  optionPart
    .split(/\s*(?:;|,\s)\s*/)
    .map(part => part.trim())
    .filter(Boolean);
const optionTokenMatches = (token: string, groupName: string, valueName: string) => {
  const prefix = `${groupName}: ${valueName}`;

  return token === prefix || token.startsWith(`${prefix} +`);
};

const buildDefaultOptions = (item: MenuItem): SelectedOptions => {
  const nextOptions: SelectedOptions = {};

  (item.optionGroups ?? []).forEach((group) => {
    if (group.selectionType === "single" && group.values?.[0]) {
      nextOptions[optionKey(group)] = [optionValueKey(group.values[0])];
    }
  });

  return nextOptions;
};

interface POSProps {
  tables: TableItem[];
  sessions: SessionItem[];
  menu: MenuItem[];
  addMenu?: MenuItem[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  showAddItems: boolean;
  setShowAddItems: (show: boolean) => void;
  createBill: () => void;
  createTable: (data: { tableNumber: string; seats: string; tableName?: string }) => Promise<void>;
  deleteTable: (id: number) => void | Promise<void>;
  showQr: (session: SessionItem) => void;
  addItem: (sessionId: string, menuId: number, quantity?: number, note?: string) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number, note?: string) => void | Promise<void>;
  updateItem: (sessionId: string, menuId: number, previousNote: string, quantity: number, nextNote?: string) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
  confirmOrderReceived: (sessionId: string) => void | Promise<void>;
  doneOrderLines: Record<string, string[]>;
  toggleOrderLineDone: (sessionId: string, menuId: number, note?: string | null) => void;
  decideOrderCancellation: (sessionId: string, decision: "approved" | "rejected") => void | Promise<void>;
  confirmPayment: (sessionId: string) => void | Promise<void>;
  cancelSession: (sessionId: string) => void;
}

export default function POS({
  tables,
  sessions,
  menu,
  addMenu = menu,
  selectedSessionId,
  setSelectedSessionId,
  showAddItems,
  setShowAddItems,
  createBill,
  createTable,
  deleteTable,
  showQr,
  addItem,
  rmItem,
  updateItem,
  requestPayment,
  confirmOrderReceived,
  doneOrderLines,
  toggleOrderLineDone,
  decideOrderCancellation,
  confirmPayment,
  cancelSession,
}: POSProps) {
  const nextTableNumber = tables.length > 0 ? Math.max(...tables.map(table => table.id)) + 1 : 1;
  const [tableForm, setTableForm] = useState({ tableNumber: String(nextTableNumber), seats: "4", tableName: "" });
  const [showTableForm, setShowTableForm] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [billPanelOpen, setBillPanelOpen] = useState(true);
  const [tableEditMode, setTableEditMode] = useState(false);
  const [tableFilter, setTableFilter] = useState<"all" | "occupied" | "active" | "payment" | "free">("all");
  const [selectedAddMenu, setSelectedAddMenu] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<{ menuId: number; note: string; qty: number } | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addOptions, setAddOptions] = useState<SelectedOptions>({});
  const [addNote, setAddNote] = useState("");
  const orderLineKey = (menuId: number, note?: string | null) =>
    `${menuId}:${String(note ?? "").trim()}`;
  const isOrderLineDone = (sessionId: string, menuId: number, note?: string | null) =>
    (doneOrderLines[sessionId] ?? []).includes(orderLineKey(menuId, note));
  const selectedSession = selectedSessionId ? sessions.find(session => session.id === selectedSessionId) : null;
  const tableSessionId = (table: TableItem): string | null =>
    table.sessionId ? `B${String(table.sessionId).padStart(3, "0")}` : null;
  const tableSession = (table: TableItem): SessionItem | null => {
    const id = tableSessionId(table);
    return id ? sessions.find(session => session.id === id) ?? null : null;
  };
  const tableStats = tables.reduce(
    (stats, table) => {
      const session = tableSession(table);
      const occupied = table.status === "occupied" || Boolean(session);
      stats.all += 1;
      if (occupied) stats.occupied += 1;
      if (session?.status === "active") stats.active += 1;
      if (session?.status === "pending_payment") stats.payment += 1;
      if (!occupied) stats.free += 1;
      return stats;
    },
    { all: 0, occupied: 0, active: 0, payment: 0, free: 0 },
  );
  const filteredTables = tables.filter((table) => {
    const session = tableSession(table);
    const occupied = table.status === "occupied" || Boolean(session);

    if (tableFilter === "occupied") return occupied;
    if (tableFilter === "payment") return session?.status === "pending_payment";
    if (tableFilter === "free") return !occupied;
    return true;
  });
  const tableFilterItems: Array<{
    id: typeof tableFilter;
    label: string;
    count: number;
    tone?: "green" | "red";
  }> = [
    { id: "all", label: "ທັງໝົດ", count: tableStats.all, tone: "green" },
    { id: "occupied", label: "ບໍ່ຫວ່າງ", count: tableStats.occupied, tone: "red" },
    { id: "payment", label: "ລໍຊໍາລະ", count: tableStats.payment, tone: "red" },
    { id: "free", label: "ວ່າງ", count: tableStats.free, tone: "green" },
  ];
  const openCustomerView = (sessionId: string) => {
    window.open(BILL_URL(sessionId), "_blank", "noopener,noreferrer");
  };
  const renderMenuThumb = (item: MenuItem) => (
    item.image ? (
      <img src={item.image} alt={item.name} />
    ) : (
      <span>{item.emoji || "ມ"}</span>
    )
  );
  const isOptionSelected = (group: MenuOptionGroup, value: MenuOptionValue) =>
    (addOptions[optionKey(group)] ?? []).includes(optionValueKey(value));
  const toggleOption = (group: MenuOptionGroup, value: MenuOptionValue) => {
    const groupKey = optionKey(group);
    const valueKey = optionValueKey(value);

    setAddOptions((current) => {
      const currentValues = current[groupKey] ?? [];

      if (group.selectionType === "multiple") {
        return {
          ...current,
          [groupKey]: currentValues.includes(valueKey)
            ? currentValues.filter((item) => item !== valueKey)
            : [...currentValues, valueKey],
        };
      }

      return { ...current, [groupKey]: [valueKey] };
    });
  };
  const selectedOptionValues = selectedAddMenu
    ? (selectedAddMenu.optionGroups ?? []).flatMap((group) =>
        (group.values ?? [])
          .filter((value) => isOptionSelected(group, value))
          .map((value) => ({
            groupName: group.name,
            valueName: value.name,
            priceDelta: optionPriceDelta(value),
          })),
      )
    : [];
  const addOptionTotal = selectedOptionValues.reduce((sum, option) => sum + option.priceDelta, 0);
  const addUnitPrice = (selectedAddMenu?.price ?? 0) + addOptionTotal;
  const addTotal = addUnitPrice * addQty;
  const parseItemNoteForEdit = (item: MenuItem, note: string) => {
    const noteParts = String(note ?? "")
      .split("|")
      .map(part => part.trim())
      .filter(Boolean);
    const optionPart = noteParts[0] ?? "";
    const optionTokens = parseOptionTokens(optionPart);
    const nextOptions = buildDefaultOptions(item);
    let hasMatchedOption = false;

    (item.optionGroups ?? []).forEach((group) => {
      const matchedValues = (group.values ?? []).filter((value) => {
        const match = optionTokens.some(token => optionTokenMatches(token, group.name, value.name));
        if (match) hasMatchedOption = true;
        return match;
      });

      if (matchedValues.length > 0) {
        nextOptions[optionKey(group)] = matchedValues.map(optionValueKey);
      }
    });

    const freeNote = hasMatchedOption ? noteParts.slice(1).join(" | ") : noteParts.join(" | ");

    return { options: nextOptions, note: freeNote };
  };
  const openAddMenuDetail = (item: MenuItem) => {
    setSelectedAddMenu(item);
    setEditingItem(null);
    setAddQty(1);
    setAddOptions(buildDefaultOptions(item));
    setAddNote("");
  };
  const openEditMenuDetail = (menuItem: MenuItem, item: { id: number; qty: number; note?: string | null }) => {
    const cleanNote = String(item.note ?? "").trim();
    const parsed = parseItemNoteForEdit(menuItem, cleanNote);

    setShowAddItems(true);
    setSelectedAddMenu(menuItem);
    setEditingItem({ menuId: item.id, note: cleanNote, qty: item.qty });
    setAddQty(Math.max(1, item.qty));
    setAddOptions(parsed.options);
    setAddNote(parsed.note);
  };
  const closeAddItems = () => {
    setShowAddItems(false);
    setSelectedAddMenu(null);
    setEditingItem(null);
    setAddQty(1);
    setAddOptions({});
    setAddNote("");
  };
  const submitAddMenuItem = () => {
    if (!selectedSession || !selectedAddMenu) return;

    const optionNote = selectedOptionValues
      .map((option) => `${option.groupName}: ${option.valueName}${option.priceDelta > 0 ? ` + ${kip(option.priceDelta)}` : ""}`)
      .join(" ; ");
    const note = [optionNote, addNote.trim()].filter(Boolean).join(" | ");

    if (editingItem) {
      void updateItem(selectedSession.id, selectedAddMenu.id, editingItem.note, addQty, note);
    } else {
      void addItem(selectedSession.id, selectedAddMenu.id, addQty, note);
    }
    closeAddItems();
  };
  const submitTable = async (event: FormEvent) => {
    event.preventDefault();
    if (savingTable) return;

    setSavingTable(true);
    try {
      await createTable(tableForm);
      const next = Number(tableForm.tableNumber) + 1;
      setTableForm({
        tableNumber: Number.isFinite(next) ? String(next) : String(nextTableNumber),
        seats: tableForm.seats || "4",
        tableName: "",
      });
      setShowTableForm(false);
    } finally {
      setSavingTable(false);
    }
  };

  return (
    <div className={`pos-shell ${billPanelOpen ? "pos-shell--panel-open" : "pos-shell--panel-closed"}`}>
      <div className="pos-main">
        <div className="pos-toolbar">
          <div className="pos-table-filters">
            {tableFilterItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`pos-filter-pill ${tableFilter === item.id ? "is-active" : ""} ${item.tone === "red" ? "is-red" : "is-green"}`}
                onClick={() => setTableFilter(item.id)}
              >
                {tableFilter === item.id && <Check size={14} />}
                {tableFilter !== item.id && <span className="pos-filter-dot" />}
                <span>{item.label}</span>
                <em>{item.count}</em>
              </button>
            ))}
          </div>
          <div className="pos-toolbar-spacer" />
          <button
            onClick={() => setTableEditMode((editing) => !editing)}
            className={`pos-toolbar-action ${tableEditMode ? "is-active" : ""}`}
            type="button"
            aria-pressed={tableEditMode}
          >
            <Pencil size={13} /> {tableEditMode ? "ປິດແກ້ໄຂ" : "ແກ້ໄຂ"}
          </button>
          <button
            onClick={() => {
              setTableForm((prev) => ({ ...prev, tableNumber: prev.tableNumber || String(nextTableNumber) }));
              setShowTableForm((prev) => !prev);
            }}
            className={`pos-toolbar-action ${showTableForm ? "is-active" : ""}`}
            type="button"
            aria-pressed={showTableForm}
          >
            <Plus size={13} /> ເພີ່ມໂຕະ
          </button>
          <button
            onClick={createBill}
            className="pos-toolbar-action is-primary"
            type="button"
          >
            <QrCode size={13} /> ສ້າງ QR
          </button>
        </div>

        <div className={`pos-table-form-wrap ${showTableForm ? "is-open" : ""}`} aria-hidden={!showTableForm}>
          <form
            onSubmit={submitTable}
            style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) minmax(90px,120px) minmax(120px,1fr) auto", gap: 10, alignItems: "end", background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 14, marginBottom: 16 }}
          >
            <label style={{ display: "grid", gap: 6, fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.1 }}>
              ເລກໂຕະ
              <input
                type="number"
                min="1"
                required
                value={tableForm.tableNumber}
                onChange={(event) => setTableForm((prev) => ({ ...prev, tableNumber: event.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.1 }}>
              ບ່ອນນັ່ງ
              <input
                type="number"
                min="1"
                required
                value={tableForm.seats}
                onChange={(event) => setTableForm((prev) => ({ ...prev, seats: event.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.1 }}>
              ຊື່ໂຕະ
              <input
                value={tableForm.tableName}
                onChange={(event) => setTableForm((prev) => ({ ...prev, tableName: event.target.value }))}
                placeholder="ບໍ່ບັງຄັບ"
                style={{ width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}
              />
            </label>
            <button
              type="submit"
              disabled={savingTable}
              style={{ height: 37, borderRadius: 9, border: "none", background: C.gold, color: "#fff", padding: "0 16px", cursor: savingTable ? "wait" : "pointer", fontWeight: 700 }}
            >
              {savingTable ? "ກໍາລັງບັນທຶກ..." : "ບັນທຶກ"}
            </button>
          </form>
        </div>

        <div className="pos-table-grid">
          {filteredTables.map((table) => {
            const session = tableSession(table);
            const total = session ? sessionTotal(session, menu) : 0;
            const isSel = Boolean(session && selectedSessionId === session.id);
            const waitingPayment = session?.status === "pending_payment";
            const occupied = table.status === "occupied" || Boolean(session);
            return (
              <div
                key={table.id}
                className={`pos-table-card ${isSel ? "is-selected" : ""} ${occupied ? "is-occupied" : "is-free"} ${waitingPayment ? "is-payment" : ""}`}
                onClick={() => {
                  if (!session) return;
                  if (isSel) {
                    setBillPanelOpen((open) => !open);
                  } else {
                    setSelectedSessionId(session.id);
                    setBillPanelOpen(true);
                  }
                }}
              >
                {tableEditMode && !occupied && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteTable(table.id);
                    }}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, color: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    aria-label={`ລຶບ ${table.name}`}
                    title={`ລຶບ ${table.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="pos-table-title">{table.name}</div>
                <div className="pos-table-seats">{table.seats} ບ່ອນນັ່ງ</div>
                <div className="pos-table-meta">
                  <div>{session ? `ບິນ ${session.id} · ເປີດ ${session.createdAt}` : "ໂຕະວ່າງ"}</div>
                  <strong>{kip(total)}</strong>
                  <small>{session ? `${session.items.length} ລາຍການ · ${waitingPayment ? "ລໍຖ້າຊໍາລະ" : "ເປີດຢູ່"}` : "ບໍ່ມີບິນທີ່ເປີດ"}</small>
                </div>
              </div>
            );
          })}

          {filteredTables.length === 0 && (
            <div style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 22, color: C.textDim }}>
              {tables.length === 0 ? "ຍັງບໍ່ມີໂຕະ. ເພີ່ມໂຕະທໍາອິດດ້ານເທິງ." : "ບໍ່ມີໂຕະໃນຕົວກອງນີ້."}
            </div>
          )}
        </div>
      </div>

      <div className={`pos-bill-panel ${billPanelOpen ? "pos-bill-panel--open" : "pos-bill-panel--closed"}`}>
        {selectedSession ? (
          <>
            <div className="pos-bill-head">
              <div className="pos-bill-head-row">
                <div>
                  <div className="pos-bill-kicker">ບິນ QR</div>
                  <div className="pos-bill-title">{selectedSession.id}</div>
                  <div className="pos-bill-note">{selectedSession.note || "ເຊດຊັນລູກຄ້າ"}</div>
                </div>
                <div className="pos-bill-actions">
                  <button className="is-primary" onClick={() => showQr(selectedSession)}><QrCode size={13} /> QR</button>
                  <button onClick={() => openCustomerView(selectedSession.id)}><ExternalLink size={13} /> ເບິ່ງໜ້າລູກຄ້າ</button>
                  <button className="is-close" onClick={() => { setSelectedSessionId(null); setShowAddItems(false); setBillPanelOpen(false); }}><X size={16} /></button>
                </div>
              </div>
              {selectedSession.status === "pending_payment" && (
                <div className="pos-bill-payment-note">
                  ກໍາລັງລໍພະນັກງານຢືນຢັນການຊໍາລະ
                </div>
              )}
              {selectedSession.cancellationStatus === "pending" && (
                <div className="pos-cancellation-request">
                  <div>
                    <strong>ລູກຄ້າຂໍຍົກເລີກອໍເດີ</strong>
                    <span>{selectedSession.cancellationReason || "ບໍ່ລະບຸເຫດຜົນ"}</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="is-reject"
                      onClick={() => decideOrderCancellation(selectedSession.id, "rejected")}
                    >
                      <X size={14} /> ບໍ່ອະນຸມັດ
                    </button>
                    <button
                      type="button"
                      className="is-approve"
                      onClick={() => decideOrderCancellation(selectedSession.id, "approved")}
                    >
                      <Check size={14} /> ອະນຸມັດ
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pos-bill-items">
              {selectedSession.items.length === 0 && <div className="pos-bill-empty">ຍັງບໍ່ມີລາຍການ</div>}
              {selectedSession.items.map(item => {
                const menuItem = menu.find(entry => entry.id === item.id);
                if (!menuItem) return null;
                const lineDone = isOrderLineDone(selectedSession.id, item.id, item.note);

                return (
                  <div key={`${item.id}-${item.note ?? ""}`} className={`pos-bill-item ${lineDone ? "is-done" : ""}`}>
                    <button
                      type="button"
                      className="pos-bill-item-edit"
                      disabled={selectedSession.cancellationStatus === "pending" || lineDone}
                      onClick={() => openEditMenuDetail(menuItem, item)}
                    >
                      <div className="pos-bill-thumb">{renderMenuThumb(menuItem)}</div>
                      <div className="pos-bill-item-info">
                        <strong>{menuItem.name}</strong>
                        <small>{menuItem.cat}</small>
                        {item.note && <small className="pos-bill-item-note">ໝາຍເຫດ: {item.note}</small>}
                        {selectedSession.orderStatus && (
                          <small className={`pos-bill-item-status ${lineDone ? "is-ready" : "is-preparing"}`}>
                            {lineDone ? "ສຳເລັດແລ້ວ" : "ກຳລັງກະກຽມ"}
                          </small>
                        )}
                        <span>{kip(menuItem.price * item.qty)}</span>
                      </div>
                    </button>
                    <div className="pos-bill-qty">
                      <button
                        disabled={selectedSession.cancellationStatus === "pending" || lineDone}
                        onClick={() => rmItem(selectedSession.id, item.id, item.note ?? "")}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.qty}</span>
                      <button
                        disabled={selectedSession.cancellationStatus === "pending" || lineDone}
                        onClick={() => addItem(selectedSession.id, item.id, 1, item.note ?? "")}
                      >
                        <Plus size={13} />
                      </button>
                      {selectedSession.orderStatus && selectedSession.orderStatus !== "ready" && (
                        <button
                          type="button"
                          className={`pos-line-done-button ${lineDone ? "is-done" : ""}`}
                          disabled={selectedSession.cancellationStatus === "pending"}
                          onClick={() => toggleOrderLineDone(selectedSession.id, item.id, item.note)}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pos-bill-footer">
              <div className="pos-bill-total">
                <span>ລວມ</span>
                <strong>{kip(sessionTotal(selectedSession, menu))}</strong>
              </div>
              <div className="pos-bill-footer-actions">
                <button
                  className="pos-bill-add-more"
                  disabled={selectedSession.cancellationStatus === "pending"}
                  onClick={() => setShowAddItems(true)}
                >
                  + ເພີ່ມລາຍການ
                </button>
                {selectedSession.status === "active" &&
                selectedSession.orderStatus &&
                selectedSession.orderStatus !== "ready" ? (
                  <button
                    className="pos-bill-pay is-confirm"
                    disabled={
                      selectedSession.items.length === 0 ||
                      selectedSession.cancellationStatus === "pending"
                    }
                    onClick={() => confirmOrderReceived(selectedSession.id)}
                  >
                    <Check size={14} /> ຢືນຍັນລາຍການ
                  </button>
                ) : selectedSession.status === "active" ? (
                  <button
                    className="pos-bill-pay"
                    disabled={
                      selectedSession.items.length === 0 ||
                      selectedSession.cancellationStatus === "pending"
                    }
                    onClick={() => requestPayment(selectedSession.id)}
                  >
                    <CreditCard size={14} /> ຂໍຊໍາລະ
                  </button>
                ) : (
                  <button className="pos-bill-pay is-confirm" onClick={() => confirmPayment(selectedSession.id)}>ຢືນຢັນ</button>
                )}
              </div>
              <button className="pos-bill-cancel" onClick={() => cancelSession(selectedSession.id)}>ຍົກເລີກລາຍການ</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 13, textAlign: "center", padding: 24 }}>
            ເລືອກບິນ QR ເພື່ອຈັດການລາຍການ ແລະ ການຊໍາລະ.
          </div>
        )}
      </div>

      {showAddItems && selectedSession && (
        <div className="pos-add-overlay" role="dialog" aria-modal="true" aria-label="ເພີ່ມລາຍການເມນູ">
          <button type="button" className="pos-add-scrim" onClick={closeAddItems} aria-label="ປິດ" />
          {!selectedAddMenu ? (
            <section className="pos-add-menu-modal">
              <div className="pos-add-head">
                <div>
                  <span>ລາຍການເມນູ</span>
                  <strong>{selectedSession.id}</strong>
                </div>
                <button type="button" onClick={closeAddItems} aria-label="ປິດ"><X size={18} /></button>
              </div>
              <div className="pos-add-menu-grid">
                {addMenu.filter(item => item.ok).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="pos-add-menu-card"
                    onClick={() => openAddMenuDetail(item)}
                  >
                    <div className="pos-add-menu-image">{renderMenuThumb(item)}</div>
                    <strong>{item.name}</strong>
                    <small>{item.cat}</small>
                    <span>{kip(item.price)}</span>
                    <em><Plus size={14} /></em>
                  </button>
                ))}
                {addMenu.filter(item => item.ok).length === 0 && (
                  <div className="pos-add-empty">ບໍ່ມີເມນູທີ່ເປີດຂາຍ</div>
                )}
              </div>
            </section>
          ) : (
            <section className="pos-add-detail-modal">
              <button
                type="button"
                className="pos-add-detail-close"
                onClick={() => (editingItem ? closeAddItems() : setSelectedAddMenu(null))}
                aria-label="ປິດ"
              >
                <X size={20} />
              </button>
              <div className="pos-add-detail-image">{renderMenuThumb(selectedAddMenu)}</div>
              <div className="pos-add-detail-body">
                <div className="pos-add-detail-main">
                  <div className="pos-add-detail-meta">
                    <span>{selectedAddMenu.cat}</span>
                    <strong>{kip(selectedAddMenu.price)}</strong>
                  </div>
                  {editingItem && <div className="pos-add-edit-state">ກໍາລັງແກ້ໄຂລາຍການໃນບິນ</div>}
                  <h3>{selectedAddMenu.name}</h3>
                  {selectedAddMenu.en && selectedAddMenu.en !== selectedAddMenu.name && (
                    <p>{selectedAddMenu.en}</p>
                  )}
                  <label className="pos-add-note">
                    <span>ໝາຍເຫດ</span>
                    <textarea
                      value={addNote}
                      onChange={(event) => setAddNote(event.target.value)}
                      placeholder="ຕົວຢ່າງ: ແພ້ຖົ່ວ, ບໍ່ໃສ່ຫອມ"
                      maxLength={255}
                    />
                  </label>
                </div>
                <div className="pos-add-detail-options">
                  {(selectedAddMenu.optionGroups ?? []).map((group) => (
                    <div key={optionKey(group)} className="pos-add-option-group">
                      <div className="pos-add-option-head">
                        <span>{group.name}</span>
                        <small>
                          {group.selectionType === "multiple" ? "ເລືອກໄດ້ຫຼາຍ" : "ເລືອກໜຶ່ງຢ່າງ"}
                          {group.required ? " · ຈໍາເປັນ" : ""}
                        </small>
                      </div>
                      <div className="pos-add-option-values">
                        {(group.values ?? []).map((value) => {
                          const selected = isOptionSelected(group, value);

                          return (
                            <button
                              key={String(optionValueKey(value))}
                              type="button"
                              className={selected ? "is-selected" : ""}
                              onClick={() => toggleOption(group, value)}
                            >
                              <span>{value.name}</span>
                              {optionPriceDelta(value) > 0 && <small>+ {kip(optionPriceDelta(value))}</small>}
                              {selected && <Check size={13} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {(selectedAddMenu.optionGroups ?? []).length === 0 && (
                    <div className="pos-add-empty">ເມນູນີ້ບໍ່ມີຕົວເລືອກ</div>
                  )}
                </div>
              </div>
              <div className="pos-add-detail-bar">
                <div className="pos-add-stepper">
                  <button type="button" disabled={addQty <= 1} onClick={() => setAddQty((qty) => Math.max(1, qty - 1))}><Minus size={16} /></button>
                  <span>{addQty}</span>
                  <button type="button" onClick={() => setAddQty((qty) => qty + 1)}><Plus size={16} /></button>
                </div>
                <span className="pos-add-divider" />
                <button type="button" className="pos-add-submit" onClick={submitAddMenuItem}>
                  {editingItem ? "ອັບເດດລາຍການ" : "ເພີ່ມໃສ່ບິນ"} <span>|</span> {kip(addTotal)}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
