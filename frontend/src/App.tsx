import { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingCart, BarChart2, Users, Package, Utensils, ChefHat, Settings, LogOut, Search, Bell, QrCode, Plus, Pencil, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { C, today, now, uid, CHART_DATA, PIE_DATA, QR_URL, tblTotal } from "./config/constants";
import { NavBtn, Modal, Inp, Sel, Btn } from "./components/SharedUI";
import Dashboard from "./views/Dashboard";
import POS from "./views/POS";
import type { MenuItem, TableItem, SaleItem, StaffItem, StockItem, SessionItem } from "./types";
import { apiClient } from "./api/client";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };
type ModalState = { type: string; title?: string; data: any; msg?: string; onConfirm?: () => void } | null;

export default function App() {
  const [view, setView] = useState<string>("dashboard");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [selTable, setSelTable] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState<string>("ທັງໝົດ");
  const [showAddItems, setShowAddItems] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const parseSessionId = (value: string | number | null | undefined): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const match = String(value ?? "").match(/(\d+)/);
    return match ? Number(match[1]) : null;
  };

  useEffect(() => {
    const el = document.createElement("link"); el.rel = "stylesheet";
    el.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(el);
    return () => { if (document.head.contains(el)) document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        apiClient.menus.getAll(),
        apiClient.staff.getAll(),
        apiClient.stock.getAll(),
        apiClient.sessions.getAll(),
        apiClient.tables.getAll(),
        apiClient.sales.getAll(),
        apiClient.categories.getAll(),
      ]);

      const [menusRes, staffRes, stockRes, sessionsRes, tablesRes, salesRes, categoriesRes] = results;

      if (menusRes.status === "fulfilled") setMenu(menusRes.value || []);
      else console.error("Failed to load menus", menusRes.reason);

      if (staffRes.status === "fulfilled") setStaff(staffRes.value || []);
      else console.error("Failed to load staff", staffRes.reason);

      if (stockRes.status === "fulfilled") setStock(stockRes.value || []);
      else console.error("Failed to load stock", stockRes.reason);

      if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value || []);
      else console.error("Failed to load sessions", sessionsRes.reason);

      if (tablesRes.status === "fulfilled") setTables(tablesRes.value || []);
      else console.error("Failed to load tables", tablesRes.reason);

      if (salesRes.status === "fulfilled") setSales(salesRes.value || []);
      else console.error("Failed to load sales", salesRes.reason);

      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value || []);
      else console.error("Failed to load categories", categoriesRes.reason);

      setLoaded(true);
    })();
  }, []);

  // Data is now persisted via API - no need for localStorage

  const toast = (msg: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  };

  const setField = (field: string, value: any) => setModal(prev => prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev);

  const addItem = (mid: number) => {
    setTables(p => p.map(t => {
      if (t.id !== selTable) return t;
      const existing = t.items.find(i => i.id === mid);
      return existing
        ? { ...t, items: t.items.map(i => i.id === mid ? { ...i, qty: i.qty + 1 } : i) }
        : { ...t, items: [...t.items, { id: mid, qty: 1 }] };
    }));
  };

  const rmItem = (mid: number) => {
    setTables(p => p.map(t => {
      if (t.id !== selTable) return t;
      const existing = t.items.find(i => i.id === mid);
      return existing && existing.qty > 1
        ? { ...t, items: t.items.map(i => i.id === mid ? { ...i, qty: i.qty - 1 } : i) }
        : { ...t, items: t.items.filter(i => i.id !== mid) };
    }));
  };

  const openTable = async (id: number) => {
    try {
      const session = await apiClient.sessions.create({
        sessionType: "dine-in",
        tableNumber: id,
        staffId: null,
        status: "Active",
      });

      setSessions(p => [session, ...p]);
      setTables(p => p.map(t => t.id === id ? { ...t, status: "occupied", since: now(), sessionId: parseSessionId(session.id) ?? t.sessionId ?? null } : t));
      toast(`ເປີດໃຊ້ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error('Open table failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const checkout = async (id: number) => {
    const table = tables.find(x => x.id === id);
    if (!table) return;
    const total = tblTotal(table, menu);
    try {
      await apiClient.sales.create({
        table: table.name,
        items: table.items.length,
        total,
        time: now(),
        date: today(),
        sessionId: table.sessionId ?? parseSessionId(table.name),
      });

      if (table.sessionId) {
        await apiClient.sessions.update(table.sessionId, {
          sessionType: "dine-in",
          tableNumber: table.id,
          staffId: null,
          status: "Completed",
          endedAt: new Date().toISOString(),
        });
      }

      setSales(p => [{ id: uid(p), table: table.name, items: table.items.length, total, time: now(), date: today(), sessionId: table.sessionId ?? null }, ...p]);
      setTables(p => p.map(x => x.id === id ? { ...x, status: "free" as const, items: [], since: null, sessionId: null } : x));
      if (table.sessionId) {
        setSessions(p => p.filter(s => parseSessionId(s.id) !== table.sessionId));
      }
      setSelTable(null);
      setShowAddItems(false);
      toast(`ຊຳລະໂຕະ ${table.name} ສຳເລັດ`, "success");
    } catch (err) {
      console.error('Checkout failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const toggleOk = async (id: number) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;

    try {
      await apiClient.menus.update(id, {
        ...item,
        ok: !item.ok,
        categoryId: item.categoryId ?? null,
      });
      setMenu(p => p.map(m => m.id === id ? { ...m, ok: !m.ok } : m));
    } catch (err) {
      console.error('Toggle menu availability failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const submitMenu = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.name || !data.price) {
      toast("ໃສ່ຂໍ້ມູນທີ່ຈໍາເປັນ", "error");
      return;
    }
    const selectedCategoryName = String(data.cat ?? data.category_name ?? "");
    const category = categories.find(c => {
      const categoryId = c.category_id ?? c.id ?? c.categoryId;
      const categoryName = c.category_name ?? c.categoryName ?? c.name;
      return categoryId === data.categoryId || categoryName === selectedCategoryName;
    });
    const cleaned = { ...data, price: Number(data.price), sold: data.sold ?? 0, ok: Boolean(data.ok), emoji: data.emoji || "🍜", categoryId: category?.category_id ?? category?.id ?? category?.categoryId ?? null };
    try {
      if (data.id) {
        await apiClient.menus.update(data.id, cleaned);
        setMenu(p => p.map(m => m.id === data.id ? { ...m, ...cleaned } : m));
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.menus.create(cleaned);
        setMenu(p => [...p, { ...cleaned, id: result.data.menu_id }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error('Menu operation failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteMenu = (id: number, name: string) => setModal({
    type: "confirm",
    title: "ລົບເມນູ",
    msg: `ລົບ «${name}» ບໍ?`,
    data: { id },
    onConfirm: async () => {
      try {
        await apiClient.menus.delete(id);
        setMenu(p => p.filter(m => m.id !== id));
        toast(`ລົບ «${name}» ສຳເລັດ`, "info");
        setModal(null);
      } catch (err) {
        console.error('Delete failed', err);
        toast("ຜິດພາດ", "error");
      }
    }
  });

  const submitStaff = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.name) {
      toast("ໃສ່ຊື່", "error");
      return;
    }
    try {
      if (data.id) {
        await apiClient.staff.update(data.id, data);
        setStaff(p => p.map(s => s.id === data.id ? { ...s, ...data } : s));
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.staff.create({ ...data, orders: Number(data.orders || 0) });
        setStaff(p => [...p, { ...data, id: result.data.staff_id, orders: Number(data.orders || 0) }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error('Staff operation failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteStaff = (id: number, name: string) => setModal({
    type: "confirm",
    title: "ລົບພະນັກ",
    msg: `ລົບ «${name}» ບໍ?`,
    data: { id },
    onConfirm: async () => {
      try {
        await apiClient.staff.delete(id);
        setStaff(p => p.filter(s => s.id !== id));
        toast(`ລົບ «${name}» ສຳເລັດ`, "info");
        setModal(null);
      } catch (err) {
        console.error('Delete failed', err);
        toast("ຜິດພາດ", "error");
      }
    }
  });

  const submitStock = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.name || data.cur === "") {
      toast("ໃສ່ຂໍ້ມູນທີ່ຈໍາເປັນ", "error");
      return;
    }
    const cleaned = { ...data, cur: Number(data.cur), min: Number(data.min || 0) };
    try {
      if (data.id) {
        await apiClient.stock.update(data.id, cleaned);
        setStock(p => p.map(s => s.id === data.id ? { ...s, ...cleaned } : s));
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.stock.create(cleaned);
        setStock(p => [...p, { ...cleaned, id: result.data.id }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error('Stock operation failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteStock = (id: number, name: string) => setModal({
    type: "confirm",
    title: "ລົບສິນຄ້າ",
    msg: `ລົບ «${name}» ບໍ?`,
    data: { id },
    onConfirm: async () => {
      try {
        await apiClient.stock.delete(id);
        setStock(p => p.filter(s => s.id !== id));
        toast(`ລົບ «${name}» ສຳເລັດ`, "info");
        setModal(null);
      } catch (err) {
        console.error('Delete failed', err);
        toast("ຜິດພາດ", "error");
      }
    }
  });

  const submitReceive = () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.qty || Number(data.qty) <= 0) {
      toast("ໃສ່ຈຳນວນ", "error");
      return;
    }
    setStock(p => p.map(s => s.id === data.id ? { ...s, cur: s.cur + Number(data.qty) } : s));
    toast(`ເພີ່ມ ${data.qty} ${data.unit} ສຳເລັດ`, "success");
    setModal(null);
  };

  const submitSession = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    try {
      const created = await apiClient.sessions.create({
        sessionType: data.sessionType ?? "dine-in",
        tableNumber: data.tableNumber ?? null,
        staffId: data.staffId ?? null,
        status: "Active",
      });
      setSessions(p => [created, ...p]);
      setModal(null);
      toast(`ສ້າງ ${created.id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error('Session creation failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const requestPayment = (id: string) => {
    setSessions(p => p.map(x => x.id === id ? { ...x, status: "pending_payment", orderStatus: null } : x));
    toast(`ຂໍການຊໍາລະ ${id}`, "info");
  };

  const confirmPayment = async (id: string) => {
    const session = sessions.find(x => x.id === id);
    if (!session) return;
    const total = session.items.reduce((sum, item) => sum + (menu.find(m => m.id === item.id)?.price ?? 0) * item.qty, 0);
    try {
      await apiClient.sales.create({
        table: session.id,
        items: session.items.length,
        total,
        time: now(),
        date: today()
      });
      const sessionNumericId = parseSessionId(session.id);
      if (sessionNumericId !== null) {
        await apiClient.sessions.update(sessionNumericId, {
          sessionType: session.sessionType ?? "dine-in",
          tableNumber: session.tableNumber ?? null,
          staffId: session.staffId ?? null,
          status: "Completed",
          endedAt: new Date().toISOString(),
        });
      }
      setSales(p => [{ id: uid(p), table: session.id, items: session.items.length, total, time: now(), date: today(), sessionId: sessionNumericId }, ...p]);
      setSessions(p => p.filter(x => x.id !== id));
      setModal(null);
      toast(`ຊໍາລະ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error('Payment failed', err);
      toast("ຜິດພາດ", "error");
    }
  };

  const cancelSession = (id: string) => setModal({
    type: "confirm",
    title: "ຍົກເລີກ Bill",
    msg: `ຍົກເລີກ ${id} ຫຼື ບໍ?`,
    data: { id },
    onConfirm: async () => {
      try {
        const session = sessions.find(x => x.id === id);
        const sessionNumericId = parseSessionId(id);
        if (sessionNumericId !== null && session) {
          await apiClient.sessions.update(sessionNumericId, {
            sessionType: session.sessionType ?? "dine-in",
            tableNumber: session.tableNumber ?? null,
            staffId: session.staffId ?? null,
            status: "Completed",
            endedAt: new Date().toISOString(),
          });
        }
        setSessions(p => p.filter(s => s.id !== id));
        setModal(null);
        toast(`ຍົກເລີກ ${id}`, "info");
      } catch (err) {
        console.error('Cancel failed', err);
        toast("ຜິດພາດ", "error");
      }
    }
  });

  const menuCategories = ["ທັງໝົດ", ...categories.map(c => c.category_name || c.categoryName || c.name)];

  const revenueTotal = sales.reduce((sum, sale) => sum + sale.total, 0);
  const occupiedTablesCount = tables.filter(t => t.status === "occupied").length;
  const activeBillsCount = sessions.length;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "ຫຼັກ" },
    { id: "pos", icon: ShoppingCart, label: "POS" },
    { id: "menu", icon: Utensils, label: "ເມນູ" },
    { id: "stock", icon: Package, label: "ຄັງ" },
    { id: "billing", icon: QrCode, label: "Bill" },
    { id: "reports", icon: BarChart2, label: "ລາຍງານ" },
    { id: "staff", icon: Users, label: "ພະນັກ" },
  ];

  const titles: Record<string, string> = { dashboard: "ພາບລວມ", pos: "ຈັດການໂຕະ", menu: "ເມນູ", stock: "ຄັງ", billing: "ບິນ", reports: "ລາຍງານ", staff: "ພະນັກ" };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: C.bg, fontFamily: "'DM Sans',sans-serif", color: C.text, overflow: "hidden" }}>
      <div style={{ width: 66, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 7px", gap: 3, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: C.goldDim, border: `1px solid ${C.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0 }}><ChefHat size={20} color={C.gold} /></div>
        {navItems.map(n => <NavBtn key={n.id} icon={n.icon} label={n.label} active={view === n.id} onClick={() => { setView(n.id); setSelTable(null); setShowAddItems(false); }} />)}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 9, color: loaded ? C.green : C.amber, textAlign: "center", paddingBottom: 6, letterSpacing: 0.5 }}>{loaded ? "● saved" : "● ..."}</div>
        <NavBtn icon={Settings} label="ຕັ້ງຄ່າ" active={false} onClick={() => { }} />
        <NavBtn icon={LogOut} label="ອອກ" active={false} onClick={() => { }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 26px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.sidebar, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 9, color: C.textMid, letterSpacing: 1.8, textTransform: "uppercase" }}>ໂໂອເລ້ເຂົ້າຊອຍ ຫຼວງພະບາງ</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif", marginTop: 1 }}>{titles[view]}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 13px" }}><Search size={13} color={C.textDim} /><span style={{ fontSize: 12, color: C.textDim }}>ຄົ້ນຫາ...</span></div>
            <div style={{ position: "relative", cursor: "pointer" }}><Bell size={17} color={C.textMid} /><div style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: C.red }} /></div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.amber},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>ໂ</div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: view === "pos" ? 0 : "22px 26px" }}>
          {view === "dashboard" && <Dashboard sales={sales} tables={tables} menu={menu} />}
          {view === "pos" && <POS tables={tables} menu={menu} selTable={selTable} setSelTable={setSelTable} showAddItems={showAddItems} setShowAddItems={setShowAddItems} addItem={addItem} rmItem={rmItem} openTable={openTable} checkout={checkout} />}
          {view === "billing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div style={{ fontSize: 14, color: C.textMid }}>ບິນ</div>
                <Btn onClick={() => setModal({ type: "session-form", title: "ເພີ່ມ Bill", data: { sessionType: "dine-in", tableNumber: "", staffId: "" } })}><Plus size={14} /> ເພີ່ມ Bill</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {sessions.map(s => {
                  const total = s.items.reduce((sum, item) => sum + (menu.find(m => m.id === item.id)?.price ?? 0) * item.qty, 0);
                  const pending = s.status === "pending_payment";
                  return (
                    <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.id}</div>
                          <div style={{ fontSize: 11, color: C.textDim }}>{s.createdAt} · {s.payMethod} · {s.note}</div>
                        </div>
                        <div style={{ fontSize: 12, color: pending ? C.red : C.green, padding: "6px 10px", borderRadius: 999, background: pending ? "rgba(183,28,28,0.12)" : "rgba(74,140,69,0.12)" }}>
                          {pending ? "ລໍຖ້າຊໍາລະ" : "ເປີດ"}
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>{total.toLocaleString("en")} ₭</div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: C.textDim, fontSize: 12 }}>
                        <span>{s.note}</span>
                        <span>{s.items.length} ລາຍການ</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {!pending && <Btn variant="secondary" onClick={() => requestPayment(s.id)}>ຂໍການຊໍາລະ</Btn>}
                        {pending && <Btn onClick={() => confirmPayment(s.id)}>ຊໍາລະ</Btn>}
                        <Btn variant="danger" onClick={() => cancelSession(s.id)}>ຍົກເລີກ</Btn>
                      </div>
                    </div>
                  );
                })}
                {sessions.length === 0 && <div style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, color: C.textDim }}>ບໍ່ມີບິນໃຫ້ສະແດງ</div>}
              </div>
            </div>
          )}
          {view === "menu" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div style={{ fontSize: 14, color: C.textMid }}>ເມນູທັງໝົດ</div>
                <Btn onClick={() => setModal({ type: "menu-form", title: "ເພີ່ມເມນູ", data: { name: "", en: "", price: "", cat: categories[0]?.category_name || categories[0]?.categoryName || "", emoji: "🍜", ok: true } })}><Plus size={14} /> ເພີ່ມເມນູ</Btn>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{menuCategories.map(c => <button key={c} onClick={() => setActiveCat(c)} style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${activeCat === c ? C.gold : C.border}`, background: activeCat === c ? C.goldDim : C.card, color: C.text }}>{c}</button>)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
                {menu.filter(item => activeCat === "ທັງໝົດ" || item.cat === activeCat).map(item => (
                  <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{item.en}</div></div>
                      <div style={{ fontSize: 18 }}>{item.emoji}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>{item.price}</span>
                      <span style={{ fontSize: 11, color: item.ok ? C.green : C.textDim, padding: "4px 8px", borderRadius: 999, background: item.ok ? "rgba(74,140,69,0.12)" : "rgba(90,90,90,0.08)" }}>{item.ok ? "ເປີດ" : "ປິດ"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => toggleOk(item.id)} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer" }}>{item.ok ? "ປິດ" : "ເປີດ"}</button>
                      <button onClick={() => setModal({ type: "menu-form", title: "ແກ້ໄຂເມນູ", data: { ...item, price: String(item.price) } })} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer" }}><Pencil size={14} /> ແກ້ໄຂ</button>
                      <button onClick={() => deleteMenu(item.id, item.name)} style={{ width: 38, background: "rgba(208,64,48,0.12)", border: "1px solid rgba(208,64,48,0.3)", borderRadius: 10, color: C.red, cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === "stock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div style={{ fontSize: 14, color: C.textMid }}>ຄັງສິນຄ້າ</div>
                <Btn onClick={() => setModal({ type: "stock-form", title: "ເພີ່ມສິນຄ້າ", data: { name: "", unit: "kg", cur: "", min: "" } })}><Plus size={14} /> ເພີ່ມສິນຄ້າ</Btn>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStockFilter("all")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${stockFilter === "all" ? C.gold : C.border}`, background: stockFilter === "all" ? C.goldDim : C.card }}>ທັງໝົດ</button>
                <button onClick={() => setStockFilter("low")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${stockFilter === "low" ? C.gold : C.border}`, background: stockFilter === "low" ? C.goldDim : C.card }}>ຕ່ຳ</button>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 1fr", padding: "14px 16px", gap: 10, fontSize: 11, color: C.textMid, textTransform: "uppercase" }}><span>ສິນຄ້າ</span><span>ຫົວໜ່ວຍ</span><span>ຈຳນວນ</span><span>ຫຼັກ</span><span>ການຈັດການ</span></div>
                {stock.filter(r => stockFilter === "all" || r.cur <= r.min).map(r => {
                  const low = r.cur <= r.min;
                  return (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 1fr", padding: "14px 16px", borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: C.text }}>{r.name}</span>
                      <span style={{ fontSize: 12, color: C.textDim }}>{r.unit}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: low ? C.red : C.text }}>{r.cur}</span>
                      <span style={{ fontSize: 12, color: C.textDim }}>{r.min}</span>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setModal({ type: "stock-receive", title: `ນໍາເຂົ້າ ${r.name}`, data: { ...r, qty: "" } })} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ຮັບເຂົ້າ</button>
                        <button onClick={() => setModal({ type: "stock-form", title: "ແກ້ໄຂສິນຄ້າ", data: { ...r, cur: String(r.cur), min: String(r.min) } })} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button>
                        <button onClick={() => deleteStock(r.id, r.name)} style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", cursor: "pointer", color: C.red }}>ລຶບ</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[{ label: "ລາຍຮັບລວມ", value: `${revenueTotal.toLocaleString("en")} ₭`, extra: "ຈາກບິນຈິງ", color: C.gold }, { label: "ໃບບິນ", value: `${activeBillsCount}`, extra: "ບິນເປີດ", color: C.green }, { label: "ໂຕະທີ່ໃຊ້", value: `${occupiedTablesCount}/${tables.length}`, extra: "ໂຕະທີ່ກຳລັງໃຊ້", color: C.blue }].map(item => (
                  <div key={item.label} style={{ flex: 1, minWidth: 140, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: 1.4 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 7 }}>{item.value}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, color: item.color }}>{item.extra}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 18 }}>ລາຍຮັບ 6 ວັນ</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {CHART_DATA.map(item => (
                      <div key={item.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 28, fontSize: 11, color: C.textMid }}>{item.day}</span>
                        <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 999 }}><div style={{ width: `${Math.min(100, (item.amt / 900000) * 100)}%`, height: "100%", background: C.gold }} /></div>
                        <span style={{ width: 80, fontSize: 11, color: C.textDim, textAlign: "right" }}>{item.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 18 }}>ສ່ວນລາຍຮັບ</div>
                  {PIE_DATA.map(e => (
                    <div key={e.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} /><span style={{ fontSize: 11, color: C.textMid }}>{e.name}</span></div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>ປະຫວັດການຂາຍ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 90px", gap: 12, fontSize: 11, color: C.textMid, textTransform: "uppercase", marginBottom: 10 }}><span>ໂຕະ</span><span>ລາຍການ</span><span>ຍອດ</span><span>ວັນທີ່</span><span>ເວລາ</span></div>
                {sales.map(s => (
                  <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 90px", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.text }}>{s.table}</span>
                    <span style={{ color: C.textDim }}>{s.items} ລາຍການ</span>
                    <span style={{ color: C.gold, fontWeight: 600 }}>{s.total}</span>
                    <span style={{ color: C.textDim }}>{s.date}</span>
                    <span style={{ color: C.textDim }}>{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === "staff" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn onClick={() => setModal({ type: "staff-form", title: "ເພີ່ມພະນັກງານ", data: { name: "", role: "ພະນັກງານ", since: "", orders: 0, emoji: "👩‍🍳" } })}><Plus size={14} /> ເພີ່ມພະນັກ</Btn></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                {staff.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}><div style={{ width: 46, height: 46, borderRadius: "50%", background: C.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.emoji || "👤"}</div><div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{s.role}</div></div></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><div><div style={{ fontSize: 10, color: C.textMid }}>ເລີ່ມເວລາ</div><div style={{ fontSize: 13, color: C.text }}>{s.since}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.textMid }}>ລາຍການ</div><div style={{ fontSize: 13, color: C.text }}>{s.orders}</div></div></div>
                    <div style={{ display: "flex", gap: 8 }}><button onClick={() => setModal({ type: "staff-form", title: "ແກ້ໄຂພະນັກງານ", data: { ...s } })} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>ແກ້ໄຂ</button><button onClick={() => deleteStaff(s.id, s.name)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid rgba(208,64,48,0.3)`, background: "rgba(208,64,48,0.08)", color: C.red, cursor: "pointer" }}>ລຶບ</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.type === "menu-form" && (
        <Modal title={modal.title ?? "ເມນູ"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Inp label="ຊື່" value={modal.data.name} onChange={e => setField("name", e.target.value)} />
            <Inp label="ຊື່ອັງກິດ" value={modal.data.en} onChange={e => setField("en", e.target.value)} />
            <Inp label="ລາຄາ (₭)" value={modal.data.price} onChange={e => setField("price", e.target.value)} />
            <Inp label="Emoji" value={modal.data.emoji} onChange={e => setField("emoji", e.target.value)} />
          </div>
          <Sel label="ໝວດ" value={modal.data.cat} onChange={e => setField("cat", e.target.value)}>
            {categories.map(c => <option key={c.category_id || c.categoryId} value={c.category_name || c.categoryName || c.name}>{c.category_name || c.categoryName || c.name}</option>)}
          </Sel>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn onClick={submitMenu}>ບັນທຶກ</Btn></div>
        </Modal>
      )}

      {modal?.type === "staff-form" && (
        <Modal title={modal.title ?? "ພະນັກງານ"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Inp label="ຊື່" value={modal.data.name} onChange={e => setField("name", e.target.value)} />
            <Inp label="Emoji" value={modal.data.emoji} onChange={e => setField("emoji", e.target.value)} />
            <Sel label="ຕໍາແໜ່ງ" value={modal.data.role} onChange={e => setField("role", e.target.value)}><option value="ພະນັກງານ">ພະນັກງານ</option><option value="ເຈົ້າຂອງ">ເຈົ້າຂອງ</option><option value="ຫຸ້ນໄຟ">ຫຸ້ນໄຟ</option></Sel>
            <Inp label="ເວລາເລີ່ມ" value={modal.data.since} onChange={e => setField("since", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn onClick={submitStaff}>ບັນທຶກ</Btn></div>
        </Modal>
      )}

      {modal?.type === "session-form" && (
        <Modal title={modal.title ?? "Bill"} onClose={() => setModal(null)}>
          <Sel label="ປະເພດເຊດຊັນ" value={modal.data.sessionType} onChange={e => setField("sessionType", e.target.value)}>
            <option value="dine-in">ທານທີ່ຮ້ານ</option>
            <option value="takeaway">ກັບບ້ານ</option>
          </Sel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Inp label="ເລກໂຕະ" type="number" value={modal.data.tableNumber} onChange={e => setField("tableNumber", e.target.value)} />
            <Inp label="Staff ID" type="number" value={modal.data.staffId} onChange={e => setField("staffId", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn onClick={submitSession}>ບັນທຶກ</Btn></div>
        </Modal>
      )}

      {modal?.type === "stock-form" && (
        <Modal title={modal.title ?? "ສິນຄ້າ"} onClose={() => setModal(null)}>
          <Inp label="ຊື່" value={modal.data.name} onChange={e => setField("name", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Inp label="ຫົວໜ່ວຍ" value={modal.data.unit} onChange={e => setField("unit", e.target.value)} />
            <Inp label="ຈຳນວນ" type="number" value={modal.data.cur} onChange={e => setField("cur", e.target.value)} />
            <Inp label="ຫຼັກ" type="number" value={modal.data.min} onChange={e => setField("min", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn onClick={submitStock}>ບັນທຶກ</Btn></div>
        </Modal>
      )}

      {modal?.type === "stock-receive" && (
        <Modal title={modal.title ?? "ຮັບເຂົ້າ"} onClose={() => setModal(null)}>
          <Inp label={`ຈຳນວນ (${modal.data.unit})`} type="number" value={modal.data.qty} onChange={e => setField("qty", e.target.value)} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn onClick={submitReceive}>ຢືນຢັນ</Btn></div>
        </Modal>
      )}

      {modal?.type === "confirm" && (
        <Modal title={modal.title ?? "ຢືນຢັນ"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "10px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(208,64,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertTriangle size={22} color={C.red} /></div>
            <p style={{ fontSize: 14, color: C.textMid, textAlign: "center", margin: 0, lineHeight: 1.6 }}>{modal.msg}</p>
            <div style={{ display: "flex", gap: 10 }}><Btn variant="secondary" onClick={() => setModal(null)}>ຍົກເລີກ</Btn><Btn variant="danger" onClick={modal.onConfirm ?? (() => setModal(null))}>ຢືນຢັນ</Btn></div>
          </div>
        </Modal>
      )}

      {modal?.type === "qr-display" && (
        <Modal title={modal.title ?? "QR Bill"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ background: C.card2, borderRadius: 16, padding: 18 }}><img src={QR_URL(modal.data.id)} width={160} height={160} alt={modal.data.id} style={{ display: "block", borderRadius: 14 }} /></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{modal.data.id}</div><div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{modal.data.createdAt}</div></div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}><Btn variant="secondary" onClick={() => setModal(null)}>ປິດ</Btn><Btn onClick={() => setModal(null)}>ບັນທຶກ</Btn></div>
          </div>
        </Modal>
      )}

      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, zIndex: 1100 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", minWidth: 260 }}>
            {t.type === "error" ? <AlertTriangle size={15} color={C.red} /> : <CheckCircle size={15} color={C.green} />}
            <span style={{ fontSize: 13, color: C.text }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
