// src/views/POS.tsx
import { useState, type FormEvent } from "react";
import { Check, CreditCard, ExternalLink, Minus, Plus, Printer, QrCode, Trash2, X } from "lucide-react";
import { BILL_URL, C, kip } from "../config/constants";
import type { MenuItem, SessionItem, TableItem } from "../types";
import { printOrderBill } from "../utils/printOrderBill";

const sessionTotal = (session: SessionItem, menu: MenuItem[]): number =>
  session.items.reduce((sum, item) => {
    const menuItem = menu.find(entry => entry.id === item.id);
    return sum + (menuItem ? menuItem.price * item.qty : 0);
  }, 0);

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
  createTable: (data: { tableNumber: string; seats: string; zone?: string }) => Promise<void>;
  deleteTable: (id: number) => void | Promise<void>;
  showQr: (session: SessionItem) => void;
  addItem: (sessionId: string, menuId: number, quantity?: number, note?: string) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number, note?: string) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
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
  requestPayment,
  confirmPayment,
  cancelSession,
}: POSProps) {
  const nextTableNumber = tables.length > 0 ? Math.max(...tables.map(table => table.id)) + 1 : 1;
  const [tableForm, setTableForm] = useState({ tableNumber: String(nextTableNumber), seats: "4", zone: "" });
  const [showTableForm, setShowTableForm] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [billPanelOpen, setBillPanelOpen] = useState(true);
  const [tableFilter, setTableFilter] = useState<"all" | "occupied" | "active" | "payment" | "free">("all");
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
  const submitTable = async (event: FormEvent) => {
    event.preventDefault();
    if (savingTable) return;

    setSavingTable(true);
    try {
      await createTable(tableForm);
      const next = Number(tableForm.tableNumber) + 1;
      setTableForm({ tableNumber: Number.isFinite(next) ? String(next) : String(nextTableNumber), seats: tableForm.seats || "4", zone: "" });
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
            onClick={() => setBillPanelOpen((open) => !open)}
            className={`pos-panel-toggle ${billPanelOpen ? "is-open" : ""}`}
            type="button"
            aria-pressed={billPanelOpen}
          >
            <QrCode size={13} /> {billPanelOpen ? "ປິດບິນ" : "ເປີດບິນ"}
          </button>
          <button
            onClick={() => {
              setTableForm((prev) => ({ ...prev, tableNumber: prev.tableNumber || String(nextTableNumber) }));
              setShowTableForm((prev) => !prev);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, color: C.text, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 12 }}
          >
            <Plus size={13} /> ເພີ່ມໂຕະ
          </button>
          <button
            onClick={createBill}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.borderMid}`, color: C.gold, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 12 }}
          >
            <QrCode size={13} /> ສ້າງ QR
          </button>
        </div>

        {showTableForm && (
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
              ໂຊນ
              <input
                value={tableForm.zone}
                onChange={(event) => setTableForm((prev) => ({ ...prev, zone: event.target.value }))}
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
        )}

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
                {!occupied && (
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
                  <button onClick={() => openCustomerView(selectedSession.id)}><ExternalLink size={13} /> ເບິ່ງ</button>
                  <button onClick={() => printOrderBill(selectedSession, menu)}><Printer size={13} /> ພິມ</button>
                  <button className="is-close" onClick={() => { setSelectedSessionId(null); setShowAddItems(false); setBillPanelOpen(false); }}><X size={16} /></button>
                </div>
              </div>
              {selectedSession.status === "pending_payment" && (
                <div className="pos-bill-payment-note">
                  ກໍາລັງລໍພະນັກງານຢືນຢັນການຊໍາລະ
                </div>
              )}
            </div>

            <div className="pos-bill-items">
              {selectedSession.items.length === 0 && <div className="pos-bill-empty">ຍັງບໍ່ມີລາຍການ</div>}
              {selectedSession.items.map(item => {
                const menuItem = menu.find(entry => entry.id === item.id);
                if (!menuItem) return null;

                return (
                  <div key={`${item.id}-${item.note ?? ""}`} className="pos-bill-item">
                    <div className="pos-bill-thumb">{renderMenuThumb(menuItem)}</div>
                    <div className="pos-bill-item-info">
                      <strong>{menuItem.name}</strong>
                      <small>{menuItem.cat}</small>
                      {item.note && <small className="pos-bill-item-note">ໝາຍເຫດ: {item.note}</small>}
                      <span>{kip(menuItem.price * item.qty)}</span>
                    </div>
                    <div className="pos-bill-qty">
                      <button onClick={() => rmItem(selectedSession.id, item.id, item.note ?? "")}><Minus size={13} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => addItem(selectedSession.id, item.id, 1, item.note ?? "")}><Plus size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showAddItems && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", maxHeight: 185, overflow: "auto" }}>
                <div style={{ fontSize: 11, color: C.textMid, marginBottom: 8 }}>ເພີ່ມເມນູ:</div>
                {addMenu.filter(item => item.ok).map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItem(selectedSession.id, item.id)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, cursor: "pointer", textAlign: "left", color: C.text }}
                  >
                    <span style={{ fontSize: 13 }}>{item.emoji} {item.name}</span>
                    <span style={{ fontSize: 12, color: C.gold }}>{kip(item.price)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pos-bill-footer">
              <div className="pos-bill-total">
                <span>ລວມ</span>
                <strong>{kip(sessionTotal(selectedSession, menu))}</strong>
              </div>
              <div className="pos-bill-footer-actions">
                <button className="pos-bill-add-more" onClick={() => setShowAddItems(!showAddItems)}>{showAddItems ? "ປິດ" : "+ ເພີ່ມລາຍການ"}</button>
                {selectedSession.status === "active" ? (
                  <button className="pos-bill-pay" onClick={() => requestPayment(selectedSession.id)}><CreditCard size={14} /> ຊໍາລະ</button>
                ) : (
                  <button className="pos-bill-pay is-confirm" onClick={() => confirmPayment(selectedSession.id)}>ຢືນຢັນ</button>
                )}
              </div>
              <button className="pos-bill-cancel" onClick={() => cancelSession(selectedSession.id)}>ຍົກເລີກ / ປິດໂດຍບໍ່ຊໍາລະ</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 13, textAlign: "center", padding: 24 }}>
            ເລືອກບິນ QR ເພື່ອຈັດການລາຍການ ແລະ ການຊໍາລະ.
          </div>
        )}
      </div>
    </div>
  );
}
