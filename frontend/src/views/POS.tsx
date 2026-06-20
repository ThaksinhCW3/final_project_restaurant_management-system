// src/views/POS.tsx
import { useState, type FormEvent } from "react";
import { CreditCard, ExternalLink, Minus, Plus, Printer, QrCode, Trash2, X } from "lucide-react";
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
  addItem: (sessionId: string, menuId: number) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number) => void | Promise<void>;
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
  const selectedSession = selectedSessionId ? sessions.find(session => session.id === selectedSessionId) : null;
  const pendingPayments = sessions.filter(session => session.status === "pending_payment").length;
  const tableSessionId = (table: TableItem): string | null =>
    table.sessionId ? `B${String(table.sessionId).padStart(3, "0")}` : null;
  const tableSession = (table: TableItem): SessionItem | null => {
    const id = tableSessionId(table);
    return id ? sessions.find(session => session.id === id) ?? null : null;
  };
  const openCustomerView = (sessionId: string) => {
    window.open(BILL_URL(sessionId), "_blank", "noopener,noreferrer");
  };
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
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.textMid }}>
            <span style={{ color: C.text, fontWeight: 600 }}>{tables.length}</span> ໂຕະ ·{" "}
            <span style={{ color: C.text, fontWeight: 600 }}>{sessions.length}</span> ບິນ QR ທີ່ເປີດ ·{" "}
            <span style={{ color: C.gold, fontWeight: 600 }}>{pendingPayments}</span> ລໍຖ້າຊໍາລະ
          </span>
          <div style={{ flex: 1 }} />
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
          {tables.map((table) => {
            const session = tableSession(table);
            const total = session ? sessionTotal(session, menu) : 0;
            const isSel = Boolean(session && selectedSessionId === session.id);
            const waitingPayment = session?.status === "pending_payment";
            const occupied = table.status === "occupied" || Boolean(session);
            return (
              <div
                key={table.id}
                onClick={() => session && setSelectedSessionId(isSel ? null : session.id)}
                style={{
                  background: isSel ? "rgba(211,47,47,0.10)" : C.card,
                  border: `2px solid ${isSel ? C.gold : waitingPayment ? "rgba(208,64,48,0.33)" : occupied ? C.borderMid : C.border}`,
                  borderRadius: 15,
                  padding: "16px 15px",
                  cursor: session ? "pointer" : "default",
                  transition: "all 0.18s",
                  position: "relative",
                  opacity: occupied ? 1 : 0.78,
                }}
              >
                {waitingPayment && <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: C.red }} />}
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
                <div style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{table.name}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{table.seats} ບ່ອນນັ່ງ</div>
                <div style={{ marginTop: 11 }}>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>
                    {session ? `ບິນ ${session.id} · ເປີດ ${session.createdAt}` : "ໂຕະວ່າງ"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, fontFamily: "var(--sans)" }}>{kip(total)}</div>
                  <div style={{ fontSize: 9, color: waitingPayment ? C.gold : C.textDim, marginTop: 2 }}>
                    {session ? `${session.items.length} ລາຍການ · ${waitingPayment ? "ລໍຖ້າຊໍາລະ" : "ເປີດຢູ່"}` : "ບໍ່ມີບິນທີ່ເປີດ"}
                  </div>
                </div>
              </div>
            );
          })}

          {tables.length === 0 && (
            <div style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 22, color: C.textDim }}>
              ຍັງບໍ່ມີໂຕະ. ເພີ່ມໂຕະທໍາອິດດ້ານເທິງ.
            </div>
          )}
        </div>
      </div>

      <div style={{ width: 340, borderLeft: `1px solid ${C.border}`, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {selectedSession ? (
          <>
            <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2 }}>ບິນ QR</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{selectedSession.id}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{selectedSession.note || "ເຊດຊັນລູກຄ້າ"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => showQr(selectedSession)} style={{ background: C.goldDim, border: `1px solid ${C.borderMid}`, color: C.gold, borderRadius: 8, cursor: "pointer", padding: "6px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><QrCode size={13} /> QR</button>
                  <button onClick={() => openCustomerView(selectedSession.id)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 8, cursor: "pointer", padding: "6px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><ExternalLink size={13} /> ເບິ່ງ</button>
                  <button onClick={() => printOrderBill(selectedSession, menu)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 8, cursor: "pointer", padding: "6px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><Printer size={13} /> ພິມ</button>
                  <button onClick={() => { setSelectedSessionId(null); setShowAddItems(false); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textDim, padding: 4 }}><X size={16} /></button>
                </div>
              </div>
              {selectedSession.status === "pending_payment" && (
                <div style={{ marginTop: 10, padding: "7px 10px", background: C.goldDim, border: `1px solid ${C.borderMid}`, borderRadius: 8, fontSize: 12, color: C.gold, textAlign: "center", fontWeight: 600 }}>
                  ກໍາລັງລໍພະນັກງານຢືນຢັນການຊໍາລະ
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "10px 18px" }}>
              {selectedSession.items.length === 0 && <div style={{ textAlign: "center", color: C.textDim, fontSize: 13, marginTop: 36 }}>ຍັງບໍ່ມີລາຍການ</div>}
              {selectedSession.items.map(item => {
                const menuItem = menu.find(entry => entry.id === item.id);
                if (!menuItem) return null;

                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 17 }}>{menuItem.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{menuItem.name}</div>
                      <div style={{ fontSize: 10, color: C.textDim }}>{kip(menuItem.price)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <button onClick={() => rmItem(selectedSession.id, item.id)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(208,64,48,0.12)", border: "1px solid rgba(208,64,48,0.28)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}><Minus size={10} /></button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => addItem(selectedSession.id, item.id)} style={{ width: 22, height: 22, borderRadius: "50%", background: C.goldDim, border: `1px solid ${C.borderMid}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold }}><Plus size={10} /></button>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.text, width: 65, textAlign: "right", fontFamily: "var(--sans)" }}>{kip(menuItem.price * item.qty)}</span>
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

            <div style={{ padding: "16px 18px", borderTop: `1px solid ${C.border}`, background: C.sidebar }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, color: C.textMid }}>ລວມ</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "var(--sans)" }}>{kip(sessionTotal(selectedSession, menu))}</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 9 }}>
                <button onClick={() => setShowAddItems(!showAddItems)} style={{ flex: 1, padding: "10px", background: showAddItems ? C.card2 : "transparent", border: `1px solid ${C.borderMid}`, color: C.text, borderRadius: 10, cursor: "pointer" }}>{showAddItems ? "ປິດ" : "+ ເພີ່ມລາຍການ"}</button>
                {selectedSession.status === "active" ? (
                  <button onClick={() => requestPayment(selectedSession.id)} style={{ flex: 1, padding: "10px", background: `linear-gradient(135deg,${C.gold},${C.amber})`, border: "none", color: "#fff", fontWeight: 700, borderRadius: 10, cursor: "pointer" }}><CreditCard size={14} /> ຊໍາລະ</button>
                ) : (
                  <button onClick={() => confirmPayment(selectedSession.id)} style={{ flex: 1, padding: "10px", background: `linear-gradient(135deg,${C.green},#3a7035)`, border: "none", color: "#fff", fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>ຢືນຢັນ</button>
                )}
              </div>
              <button onClick={() => cancelSession(selectedSession.id)} style={{ width: "100%", padding: "9px", background: "rgba(208,64,48,0.08)", border: "1px solid rgba(208,64,48,0.3)", color: C.red, borderRadius: 10, cursor: "pointer" }}>ຍົກເລີກ / ປິດໂດຍບໍ່ຊໍາລະ</button>
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
