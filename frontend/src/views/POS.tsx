// src/views/POS.tsx
import { CreditCard, Minus, Plus, QrCode, X } from "lucide-react";
import { C, kip } from "../config/constants";
import type { MenuItem, SessionItem } from "../types";

const sessionTotal = (session: SessionItem, menu: MenuItem[]): number =>
  session.items.reduce((sum, item) => {
    const menuItem = menu.find(entry => entry.id === item.id);
    return sum + (menuItem ? menuItem.price * item.qty : 0);
  }, 0);

interface POSProps {
  sessions: SessionItem[];
  menu: MenuItem[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  showAddItems: boolean;
  setShowAddItems: (show: boolean) => void;
  createBill: () => void;
  showQr: (session: SessionItem) => void;
  addItem: (sessionId: string, menuId: number) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
  confirmPayment: (sessionId: string) => void | Promise<void>;
  cancelSession: (sessionId: string) => void;
}

export default function POS({
  sessions,
  menu,
  selectedSessionId,
  setSelectedSessionId,
  showAddItems,
  setShowAddItems,
  createBill,
  showQr,
  addItem,
  rmItem,
  requestPayment,
  confirmPayment,
  cancelSession,
}: POSProps) {
  const selectedSession = selectedSessionId ? sessions.find(session => session.id === selectedSessionId) : null;
  const pendingPayments = sessions.filter(session => session.status === "pending_payment").length;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.textMid }}>
            <span style={{ color: C.text, fontWeight: 600 }}>{sessions.length}</span> open QR bills ·{" "}
            <span style={{ color: C.gold, fontWeight: 600 }}>{pendingPayments}</span> waiting payment
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={createBill}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.borderMid}`, color: C.gold, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 12 }}
          >
            <QrCode size={13} /> Generate QR
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12 }}>
          {sessions.map(session => {
            const total = sessionTotal(session, menu);
            const isSelected = selectedSessionId === session.id;
            const waitingPayment = session.status === "pending_payment";

            return (
              <div
                key={session.id}
                onClick={() => {
                  setSelectedSessionId(isSelected ? null : session.id);
                  setShowAddItems(false);
                }}
                style={{ background: isSelected ? "rgba(211,47,47,0.10)" : C.card, border: `2px solid ${isSelected ? C.gold : waitingPayment ? C.gold : C.border}`, borderRadius: 15, padding: "16px 15px", cursor: "pointer", transition: "all 0.18s", position: "relative" }}
              >
                {waitingPayment && <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: C.gold }} />}
                <div style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{session.id}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{session.note || "QR customer"}</div>
                <div style={{ marginTop: 11 }}>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>opened {session.createdAt}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, fontFamily: "var(--sans)" }}>{kip(total)}</div>
                  <div style={{ fontSize: 9, color: waitingPayment ? C.gold : C.textDim, marginTop: 2 }}>
                    {session.items.length} items · {waitingPayment ? "waiting payment" : "active"}
                  </div>
                </div>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 22, color: C.textDim }}>
              No open QR bills. Generate one when a customer or group arrives.
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
                  <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2 }}>QR Bill</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{selectedSession.id}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{selectedSession.note || "Customer session"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => showQr(selectedSession)} style={{ background: C.goldDim, border: `1px solid ${C.borderMid}`, color: C.gold, borderRadius: 8, cursor: "pointer", padding: "6px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><QrCode size={13} /> QR</button>
                  <button onClick={() => { setSelectedSessionId(null); setShowAddItems(false); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textDim, padding: 4 }}><X size={16} /></button>
                </div>
              </div>
              {selectedSession.status === "pending_payment" && (
                <div style={{ marginTop: 10, padding: "7px 10px", background: C.goldDim, border: `1px solid ${C.borderMid}`, borderRadius: 8, fontSize: 12, color: C.gold, textAlign: "center", fontWeight: 600 }}>
                  Waiting for staff payment confirmation
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "10px 18px" }}>
              {selectedSession.items.length === 0 && <div style={{ textAlign: "center", color: C.textDim, fontSize: 13, marginTop: 36 }}>No items yet</div>}
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
                <div style={{ fontSize: 11, color: C.textMid, marginBottom: 8 }}>Add menu item:</div>
                {menu.filter(item => item.ok).map(item => (
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
                <span style={{ fontSize: 14, color: C.textMid }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "var(--sans)" }}>{kip(sessionTotal(selectedSession, menu))}</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 9 }}>
                <button onClick={() => setShowAddItems(!showAddItems)} style={{ flex: 1, padding: "10px", background: showAddItems ? C.card2 : "transparent", border: `1px solid ${C.borderMid}`, color: C.text, borderRadius: 10, cursor: "pointer" }}>{showAddItems ? "Close" : "+ Add item"}</button>
                {selectedSession.status === "active" ? (
                  <button onClick={() => requestPayment(selectedSession.id)} style={{ flex: 1, padding: "10px", background: `linear-gradient(135deg,${C.gold},${C.amber})`, border: "none", color: "#fff", fontWeight: 700, borderRadius: 10, cursor: "pointer" }}><CreditCard size={14} /> Pay</button>
                ) : (
                  <button onClick={() => confirmPayment(selectedSession.id)} style={{ flex: 1, padding: "10px", background: `linear-gradient(135deg,${C.green},#3a7035)`, border: "none", color: "#fff", fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>Confirm</button>
                )}
              </div>
              <button onClick={() => cancelSession(selectedSession.id)} style={{ width: "100%", padding: "9px", background: "rgba(208,64,48,0.08)", border: "1px solid rgba(208,64,48,0.3)", color: C.red, borderRadius: 10, cursor: "pointer" }}>Cancel / close without payment</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 13, textAlign: "center", padding: 24 }}>
            Select a QR bill to manage items and payment.
          </div>
        )}
      </div>
    </div>
  );
}
