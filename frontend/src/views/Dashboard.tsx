// src/views/Dashboard.tsx
import { DollarSign, ShoppingCart, Coffee, Star, TrendingUp } from "lucide-react";
import { C, kip, today, CHART_DATA, PIE_DATA } from "../config/constants";
import { StatCard } from "../components/SharedUI";
import type { SaleItem, TableItem, MenuItem } from "../types";

interface DashboardProps {
  sales: SaleItem[];
  tables: TableItem[];
  menu: MenuItem[];
}

export default function Dashboard({ sales, tables, menu }: DashboardProps) {
  const occupied = tables.filter(t => t.status === "occupied").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="ລາຍຮັບມື້ນີ້" value={kip(sales.filter(s => s.date === today()).reduce((a, s) => a + s.total, 0) || 1983000)} sub="↑ 12% ຈາກມື້ວານ" color={C.gold} icon={DollarSign} />
        <StatCard label="ຍອດຂາຍ" value={String(sales.length + 30)} sub="ທຸລະກຳທັງໝົດ" color={C.green} icon={ShoppingCart} />
        <StatCard label="ໂຕະທີ່ໃຊ້" value={`${occupied}/${tables.length}`} sub="ໂຕະ" color={C.blue} icon={Coffee} />
        <StatCard label="ເມນູທັງໝົດ" value={String(menu.length)} sub={`${menu.filter(m => m.ok).length} ລາຍການ ເປີດ`} color={C.amber} icon={Star} />
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: C.textMid, marginBottom: 3 }}>ລາຍຮັບ 6 ວັນທີ່ຜ່ານມາ</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif" }}>3,570,000 ₭</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(74,140,69,0.12)", border: "1px solid rgba(74,140,69,0.3)", borderRadius: 8, padding: "4px 10px" }}>
              <TrendingUp size={12} color={C.green} /><span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>+18%</span>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {CHART_DATA.map(item => (
              <div key={item.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, fontSize: 11, color: C.textMid }}>{item.day}</span>
                <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (item.amt / 900000) * 100)}%`, height: "100%", background: C.gold }} />
                </div>
                <span style={{ width: 80, fontSize: 11, color: C.textDim, textAlign: "right" }}>{kip(item.amt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 11, color: C.textMid, marginBottom: 2 }}>ສັດສ່ວນລາຍຮັບ</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14, fontFamily: "'Playfair Display',serif" }}>ຕາມໝວດໝູ່</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PIE_DATA.map(e => (
              <div key={e.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                  <span style={{ fontSize: 11, color: C.textMid }}>{e.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}