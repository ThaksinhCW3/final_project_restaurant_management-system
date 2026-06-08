// src/views/POS.tsx
import { QrCode, X, Clock, Minus, Plus } from "lucide-react";
import { C, kip, tblTotal } from "../config/constants";
import type { MenuItem, TableItem } from "../types";

interface POSProps {
  tables: TableItem[];
  menu: MenuItem[];
  selTable: number | null;
  setSelTable: (id: number | null) => void;
  showAddItems: boolean;
  setShowAddItems: (show: boolean) => void;
  addItem: (mid: number) => void;
  rmItem: (mid: number) => void;
  openTable: (id: number) => void;
  checkout: (id: number) => void;
}

export default function POS({
  tables, menu, selTable, setSelTable,
  showAddItems, setShowAddItems,
  addItem, rmItem, openTable, checkout
}: POSProps) {
  const occupied = tables.filter(t => t.status === "occupied").length;
  const selTblData = selTable !== null ? tables.find(t => t.id === selTable) : null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.textMid }}><span style={{ color: C.text, fontWeight: 600 }}>{occupied}</span> ໂຕະໃຊ້ · <span style={{ color: C.green, fontWeight: 600 }}>{tables.length - occupied}</span> ຫວ່າງ</span>
          <div style={{ flex: 1 }} />
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.borderMid}`, color: C.gold, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 12 }}><QrCode size={13} /> QR Scan</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(134px,1fr))", gap: 12 }}>
          {tables.map(t => {
            const tot = tblTotal(t, menu);
            const isSel = selTable === t.id;
            const isOcc = t.status === "occupied";
            return (
              <div key={t.id} onClick={() => setSelTable(isSel ? null : t.id)}
                style={{ background: isSel ? "rgba(232,160,32,0.10)" : C.card, border: `2px solid ${isSel ? C.gold : isOcc ? "rgba(208,64,48,0.33)" : C.border}`, borderRadius: 15, padding: "16px 15px", cursor: "pointer", transition: "all 0.18s", position: "relative" }}>
                {isOcc && <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: C.red }} />}
                <div style={{ fontSize: 21, fontWeight: 700, color: isOcc ? C.text : C.textMid, fontFamily: "'Playfair Display',serif" }}>{t.name}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{t.seats} ບ່ອນ</div>
                <div style={{ marginTop: 11 }}>
                  {isOcc ? (
                    <>
                      <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>ເຂົ້ານຳໃຊ້ {t.since}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, fontFamily: "'JetBrains Mono',monospace" }}>{kip(tot)}</div>
                      <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{t.items.length} ລາຍການ</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>ຫວ່າງ ✓</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 306, borderLeft: `1px solid ${C.border}`, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {selTblData ? (
          <>
            <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2 }}>ໂຕະ</div><div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif" }}>{selTblData.name}</div></div>
                <button onClick={() => { setSelTable(null); setShowAddItems(false); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textDim, padding: 4, marginTop: 2 }}><X size={16} /></button>
              </div>
              {selTblData.status === "free"
                ? <button onClick={() => openTable(selTable!)} style={{ width: "100%", background: `linear-gradient(135deg,${C.gold},${C.amber})`, border: "none", color: "#fff", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 12 }}>ເປີດໃຊ້ໂຕະ</button>
                : <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}><Clock size={11} color={C.textDim} /><span style={{ fontSize: 11, color: C.textDim }}>ເຂົ້ານຳໃຊ້ {selTblData.since}</span></div>}
            </div>

            {selTblData.status === "occupied" && (
              <>
                <div style={{ flex: 1, overflow: "auto", padding: "10px 18px" }}>
                  {selTblData.items.length === 0 && <div style={{ textAlign: "center", color: C.textDim, fontSize: 13, marginTop: 36 }}>ຍັງບໍ່ມີລາຍການ</div>}
                  {selTblData.items.map(item => {
                    const m = menu.find(x => x.id === item.id); if (!m) return null;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 17 }}>{m.emoji}</span>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{m.name}</div><div style={{ fontSize: 10, color: C.textDim }}>{kip(m.price)}</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <button onClick={() => rmItem(item.id)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(208,64,48,0.12)", border: "1px solid rgba(208,64,48,0.28)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}><Minus size={10} /></button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => addItem(item.id)} style={{ width: 22, height: 22, borderRadius: "50%", background: C.goldDim, border: `1px solid ${C.borderMid}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold }}><Plus size={10} /></button>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, width: 65, textAlign: "right", fontFamily: "'JetBrains Mono',monospace" }}>{kip(m.price * item.qty)}</span>
                      </div>
                    );
                  })}
                </div>

                {showAddItems && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", maxHeight: 185, overflow: "auto" }}>
                    <div style={{ fontSize: 11, color: C.textMid, marginBottom: 8 }}>ເລືອກລາຍການເພີ່ມ:</div>
                    {menu.filter(m => m.ok).map(m => (
                      <div key={m.id} onClick={() => addItem(m.id)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.card2, borderRadius: 8, marginBottom: 6, cursor: "pointer" }}>
                        <span style={{ fontSize: 13 }}>{m.emoji} {m.name}</span>
                        <span style={{ fontSize: 12, color: C.gold }}>{kip(m.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: "16px 18px", borderTop: `1px solid ${C.border}`, background: C.sidebar }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: C.textMid }}>ລວມທັງໝົດ</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "'JetBrains Mono',monospace" }}>{kip(tblTotal(selTblData, menu))}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowAddItems(!showAddItems)} style={{ flex: 1, padding: "10px", background: showAddItems ? C.card2 : "transparent", border: `1px solid ${C.borderMid}`, color: C.text, borderRadius: 10, cursor: "pointer" }}>{showAddItems ? "ປິດ" : "+ ເພີ່ມອາຫານ"}</button>
                    <button onClick={() => checkout(selTable!)} style={{ flex: 2, padding: "10px", background: `linear-gradient(135deg,${C.gold},${C.amber})`, border: "none", color: "#fff", fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>ຊຳລະເງິນ</button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 13 }}>ເລືອກໂຕະເພື່ອເບິ່ງອໍເດີ້</div>
        )}
      </div>
    </div>
  );
}