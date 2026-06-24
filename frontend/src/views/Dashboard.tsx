import { BanknoteArrowDown, BanknoteArrowUp, CircleDollarSign, ReceiptText } from "lucide-react";
import { C, kip } from "../config/constants";
import { StatCard } from "../components/SharedUI";
import type { MenuItem, SaleItem, SessionItem, SupplyOrderItem } from "../types";

interface DashboardProps {
  sales: SaleItem[];
  sessions: SessionItem[];
  menu: MenuItem[];
  supplyOrders: SupplyOrderItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseSaleDate = (value: string) => {
  const parts = String(value ?? "").split(/[/-]/).map(Number);
  if (parts.length === 3) {
    if (parts[0] > 31) return startOfDay(new Date(parts[0], parts[1] - 1, parts[2]));
    return startOfDay(new Date(new Date().getFullYear(), parts[0] - 1, parts[1]));
  }
  if (parts.length === 2) {
    return startOfDay(new Date(new Date().getFullYear(), parts[0] - 1, parts[1]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
};

const dateKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export default function Dashboard({ sales, sessions, menu, supplyOrders }: DashboardProps) {
  const totalIncome = sales.reduce((sum, sale) => sum + sale.total, 0);
  const completedImports = supplyOrders.filter((order) => order.status === "completed");
  const totalOutcome = completedImports.reduce((sum, order) => sum + order.totalAmount, 0);
  const netBalance = totalIncome - totalOutcome;
  const pendingPayments = sessions.filter((session) => session.status === "pending_payment").length;
  const activeBills = sessions.filter((session) => session.status === "active").length;

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_MS);
    return {
      date,
      key: dateKey(date),
      label: date.toLocaleDateString("lo-LA", { weekday: "short" }),
      shortDate: date.toLocaleDateString("lo-LA", { day: "2-digit", month: "2-digit" }),
      income: 0,
      outcome: 0,
    };
  });
  const dayByKey = new Map(days.map((day) => [day.key, day]));

  sales.forEach((sale) => {
    const parsed = parseSaleDate(sale.date);
    if (!parsed) return;
    const day = dayByKey.get(dateKey(parsed));
    if (day) day.income += sale.total;
  });
  completedImports.forEach((order) => {
    const parsed = new Date(order.orderDate);
    if (Number.isNaN(parsed.getTime())) return;
    const day = dayByKey.get(dateKey(startOfDay(parsed)));
    if (day) day.outcome += order.totalAmount;
  });

  const sevenDayIncome = days.reduce((sum, day) => sum + day.income, 0);
  const sevenDayOutcome = days.reduce((sum, day) => sum + day.outcome, 0);
  const chartMaximum = Math.max(1, ...days.flatMap((day) => [day.income, day.outcome]));

  const soldByMenu = new Map<number, number>();
  sales.forEach((sale) => {
    (sale.orders ?? []).forEach((order) => {
      soldByMenu.set(order.id, (soldByMenu.get(order.id) ?? 0) + order.qty);
    });
  });
  const popularMenus = menu
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: soldByMenu.get(item.id) ?? 0,
      revenue: (soldByMenu.get(item.id) ?? 0) * item.price,
    }))
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="dashboard-overview">
      <div className="dashboard-stat-grid">
        <StatCard label="ລາຍຮັບລວມ" value={kip(totalIncome)} sub="ຈາກບິນທີ່ຊຳລະແລ້ວ" color={C.gold} icon={BanknoteArrowUp} />
        <StatCard label="ລາຍຈ່າຍນຳເຂົ້າ" value={kip(totalOutcome)} sub={`${completedImports.length} ໃບສັ່ງທີ່ຮັບແລ້ວ`} color={C.red} icon={BanknoteArrowDown} />
        <StatCard label="ຍອດຄົງເຫຼືອ" value={kip(netBalance)} sub="ລາຍຮັບຫັກລາຍຈ່າຍນຳເຂົ້າ" color={netBalance >= 0 ? C.green : C.red} icon={CircleDollarSign} />
        <StatCard label="ບິນ QR ທີ່ເປີດ" value={String(sessions.length)} sub={`${activeBills} ກຳລັງໃຊ້ · ${pendingPayments} ລໍຊຳລະ`} color={C.blue} icon={ReceiptText} />
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-cashflow">
          <div className="dashboard-panel-heading">
            <div>
              <span>ກະແສເງິນ 7 ວັນຫຼ້າສຸດ</span>
              <strong>{kip(sevenDayIncome - sevenDayOutcome)}</strong>
              <small>ລາຍຮັບ {kip(sevenDayIncome)} · ລາຍຈ່າຍ {kip(sevenDayOutcome)}</small>
            </div>
            <div className="dashboard-chart-legend">
              <span><i className="is-income" /> ລາຍຮັບ</span>
              <span><i className="is-outcome" /> ລາຍຈ່າຍ</span>
            </div>
          </div>

          <div className="dashboard-bar-chart">
            {days.map((day) => (
              <div className="dashboard-chart-day" key={day.key}>
                <div className="dashboard-chart-values">
                  <span>{day.income > 0 ? kip(day.income) : ""}</span>
                  <span>{day.outcome > 0 ? kip(day.outcome) : ""}</span>
                </div>
                <div className="dashboard-chart-bars">
                  <div className="dashboard-chart-track">
                    <div className="dashboard-chart-bar is-income" style={{ height: `${Math.max(day.income > 0 ? 8 : 0, (day.income / chartMaximum) * 100)}%` }} />
                  </div>
                  <div className="dashboard-chart-track">
                    <div className="dashboard-chart-bar is-outcome" style={{ height: `${Math.max(day.outcome > 0 ? 8 : 0, (day.outcome / chartMaximum) * 100)}%` }} />
                  </div>
                </div>
                <strong>{day.label}</strong>
                <small>{day.shortDate}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel dashboard-popular">
          <div className="dashboard-panel-heading">
            <div>
              <span>ເມນູຂາຍດີ</span>
              <strong>5 ອັນດັບທຳອິດ</strong>
            </div>
          </div>
          <div className="dashboard-popular-list">
            {popularMenus.map((item, index) => (
              <div key={item.id} className="dashboard-popular-item">
                <span>{index + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.quantity} ລາຍການ</small>
                </div>
                <b>{kip(item.revenue)}</b>
              </div>
            ))}
            {popularMenus.length === 0 && (
              <div className="dashboard-empty">ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
