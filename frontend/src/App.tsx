import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart2,
  Users,
  Package,
  Utensils,
  ChefHat,
  Settings,
  LogOut,
  Search,
  Bell,
  QrCode,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import {
  C,
  today,
  now,
  uid,
  QR_URL,
  tblTotal,
} from "./config/constants";
import { NavBtn, Modal, Inp, Sel, Btn } from "./components/SharedUI";
import Dashboard from "./views/Dashboard";
import {
  BillingView,
  MenuView,
  RecipeView,
  ReportsView,
  StaffView,
  StockView,
} from "./views/ManagementPages";
import POS from "./views/POS";
import type {
  MenuItem,
  TableItem,
  SaleItem,
  StaffItem,
  StockItem,
  SessionItem,
  IngredientItem,
  RecipeItem,
} from "./types";
import type { AppModalState } from "./types/app";
import { apiClient } from "./api/client";
import "./index.css";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };

export default function App() {
  const [view, setView] = useState<string>("dashboard");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  const [selTable, setSelTable] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState<string>("ທັງໝົດ");
  const [showAddItems, setShowAddItems] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [modal, setModal] = useState<AppModalState>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const parseSessionId = (
    value: string | number | null | undefined,
  ): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const match = String(value ?? "").match(/(\d+)/);
    return match ? Number(match[1]) : null;
  };

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
        apiClient.ingredients.getAll(),
        apiClient.recipes.getAll(),
      ]);

      const [
        menusRes,
        staffRes,
        stockRes,
        sessionsRes,
        tablesRes,
        salesRes,
        categoriesRes,
        ingredientsRes,
        recipesRes,
      ] = results;

      if (menusRes.status === "fulfilled") setMenu(menusRes.value || []);
      else console.error("Failed to load menus", menusRes.reason);

      if (staffRes.status === "fulfilled") setStaff(staffRes.value || []);
      else console.error("Failed to load staff", staffRes.reason);

      if (stockRes.status === "fulfilled") setStock(stockRes.value || []);
      else console.error("Failed to load stock", stockRes.reason);

      if (sessionsRes.status === "fulfilled")
        setSessions(sessionsRes.value || []);
      else console.error("Failed to load sessions", sessionsRes.reason);

      if (tablesRes.status === "fulfilled") setTables(tablesRes.value || []);
      else console.error("Failed to load tables", tablesRes.reason);

      if (salesRes.status === "fulfilled") setSales(salesRes.value || []);
      else console.error("Failed to load sales", salesRes.reason);

      if (categoriesRes.status === "fulfilled")
        setCategories(categoriesRes.value || []);
      else console.error("Failed to load categories", categoriesRes.reason);

      if (ingredientsRes.status === "fulfilled")
        setIngredients(ingredientsRes.value || []);
      else console.error("Failed to load ingredients", ingredientsRes.reason);

      if (recipesRes.status === "fulfilled") setRecipes(recipesRes.value || []);
      else console.error("Failed to load recipes", recipesRes.reason);

      setLoaded(true);
    })();
  }, []);

  // Data is now persisted via API - no need for localStorage

  const toast = (msg: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  };

  const setField = (field: string, value: any) =>
    setModal((prev) =>
      prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev,
    );

  const handleMenuImageUpload = async (file: File | null) => {
    if (!file) return;
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
      reader.onload = () => {
        const src = typeof reader.result === "string" ? reader.result : "";
        const img = new Image();
        img.onload = () => {
          const maxSide = 1024;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

    setModal((prev) =>
      prev ? { ...prev, data: { ...prev.data, image } } : prev,
    );
  };

  const addItem = (mid: number) => {
    setTables((p) =>
      p.map((t) => {
        if (t.id !== selTable) return t;
        const existing = t.items.find((i) => i.id === mid);
        return existing
          ? {
              ...t,
              items: t.items.map((i) =>
                i.id === mid ? { ...i, qty: i.qty + 1 } : i,
              ),
            }
          : { ...t, items: [...t.items, { id: mid, qty: 1 }] };
      }),
    );
  };

  const rmItem = (mid: number) => {
    setTables((p) =>
      p.map((t) => {
        if (t.id !== selTable) return t;
        const existing = t.items.find((i) => i.id === mid);
        return existing && existing.qty > 1
          ? {
              ...t,
              items: t.items.map((i) =>
                i.id === mid ? { ...i, qty: i.qty - 1 } : i,
              ),
            }
          : { ...t, items: t.items.filter((i) => i.id !== mid) };
      }),
    );
  };

  const openTable = async (id: number) => {
    try {
      const session = await apiClient.sessions.create({
        sessionType: "dine-in",
        tableNumber: id,
        staffId: null,
        status: "Active",
      });

      setSessions((p) => [session, ...p]);
      setTables((p) =>
        p.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "occupied",
                since: now(),
                sessionId: parseSessionId(session.id) ?? t.sessionId ?? null,
              }
            : t,
        ),
      );
      toast(`ເປີດໃຊ້ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Open table failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const checkout = async (id: number) => {
    const table = tables.find((x) => x.id === id);
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

      setSales((p) => [
        {
          id: uid(p),
          table: table.name,
          items: table.items.length,
          total,
          time: now(),
          date: today(),
          sessionId: table.sessionId ?? null,
        },
        ...p,
      ]);
      setTables((p) =>
        p.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "free" as const,
                items: [],
                since: null,
                sessionId: null,
              }
            : x,
        ),
      );
      if (table.sessionId) {
        setSessions((p) =>
          p.filter((s) => parseSessionId(s.id) !== table.sessionId),
        );
      }
      setSelTable(null);
      setShowAddItems(false);
      toast(`ຊຳລະໂຕະ ${table.name} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Checkout failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const toggleOk = async (id: number) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return;

    try {
      await apiClient.menus.update(id, {
        ...item,
        ok: !item.ok,
        categoryId: item.categoryId ?? null,
      });
      setMenu((p) => p.map((m) => (m.id === id ? { ...m, ok: !m.ok } : m)));
    } catch (err) {
      console.error("Toggle menu availability failed", err);
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
    const category = categories.find((c) => {
      const categoryId = c.category_id ?? c.id ?? c.categoryId;
      const categoryName = c.category_name ?? c.categoryName ?? c.name;
      return (
        categoryId === data.categoryId || categoryName === selectedCategoryName
      );
    });
    const cleaned = {
      ...data,
      price: Number(data.price),
      sold: data.sold ?? 0,
      ok: Boolean(data.ok),
      emoji: data.emoji || "🍜",
      categoryId:
        category?.category_id ?? category?.id ?? category?.categoryId ?? null,
    };
    try {
      if (data.id) {
        await apiClient.menus.update(data.id, cleaned);
        setMenu((p) =>
          p.map((m) => (m.id === data.id ? { ...m, ...cleaned } : m)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.menus.create(cleaned);
        setMenu((p) => [...p, { ...cleaned, id: result.data.menu_id }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error("Menu operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteMenu = (id: number, name: string) =>
    setModal({
      type: "confirm",
      title: "ລົບເມນູ",
      msg: `ລົບ «${name}» ບໍ?`,
      data: { id },
      onConfirm: async () => {
        try {
          await apiClient.menus.delete(id);
          setMenu((p) => p.filter((m) => m.id !== id));
          toast(`ລົບ «${name}» ສຳເລັດ`, "info");
          setModal(null);
        } catch (err) {
          console.error("Delete failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
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
        setStaff((p) =>
          p.map((s) => (s.id === data.id ? { ...s, ...data } : s)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.staff.create({
          ...data,
          orders: Number(data.orders || 0),
        });
        setStaff((p) => [
          ...p,
          {
            ...data,
            id: result.data.staff_id,
            orders: Number(data.orders || 0),
          },
        ]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error("Staff operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteStaff = (id: number, name: string) =>
    setModal({
      type: "confirm",
      title: "ລົບພະນັກ",
      msg: `ລົບ «${name}» ບໍ?`,
      data: { id },
      onConfirm: async () => {
        try {
          await apiClient.staff.delete(id);
          setStaff((p) => p.filter((s) => s.id !== id));
          toast(`ລົບ «${name}» ສຳເລັດ`, "info");
          setModal(null);
        } catch (err) {
          console.error("Delete failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const submitStock = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.name || data.cur === "") {
      toast("ໃສ່ຂໍ້ມູນທີ່ຈໍາເປັນ", "error");
      return;
    }
    const cleaned = {
      ...data,
      cur: Number(data.cur),
      min: Number(data.min || 0),
    };
    try {
      if (data.id) {
        await apiClient.stock.update(data.id, cleaned);
        setStock((p) =>
          p.map((s) => (s.id === data.id ? { ...s, ...cleaned } : s)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.stock.create(cleaned);
        setStock((p) => [...p, { ...cleaned, id: result.data.id }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      setModal(null);
    } catch (err) {
      console.error("Stock operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteStock = (id: number, name: string) =>
    setModal({
      type: "confirm",
      title: "ລົບສິນຄ້າ",
      msg: `ລົບ «${name}» ບໍ?`,
      data: { id },
      onConfirm: async () => {
        try {
          await apiClient.stock.delete(id);
          setStock((p) => p.filter((s) => s.id !== id));
          toast(`ລົບ «${name}» ສຳເລັດ`, "info");
          setModal(null);
        } catch (err) {
          console.error("Delete failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const submitRecipe = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.menuId || !data.ingredientId || !data.quantityUsed) {
      toast("ໃສ່ເມນູ, ວັດຖຸດິບ ແລະ ຈຳນວນ", "error");
      return;
    }

    const payload = {
      menuId: Number(data.menuId),
      ingredientId: Number(data.ingredientId),
      quantityUsed: Number(data.quantityUsed),
    };
    const selectedMenu = menu.find((item) => item.id === payload.menuId);
    const selectedIngredient = ingredients.find(
      (item) => item.id === payload.ingredientId,
    );
    const recipeItem = {
      ...payload,
      menuName: selectedMenu?.name ?? data.menuName ?? "Menu item",
      ingredientName:
        selectedIngredient?.name ?? data.ingredientName ?? "Ingredient",
      unit: selectedIngredient?.unit ?? data.unit ?? null,
    };

    try {
      if (data.id) {
        await apiClient.recipes.update(data.id, payload);
        setRecipes((p) =>
          p.map((recipe) =>
            recipe.id === data.id ? { ...recipe, ...recipeItem } : recipe,
          ),
        );
        toast("ອັບເດດ Recipe ສຳເລັດ");
      } else {
        const result = await apiClient.recipes.create(payload);
        setRecipes((p) => [
          ...p,
          {
            id: result.data.recipe_id,
            ...recipeItem,
          },
        ]);
        toast("ເພີ່ມ Recipe ສຳເລັດ");
      }
      setModal(null);
    } catch (err) {
      console.error("Recipe operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteRecipe = (id: number, label: string) =>
    setModal({
      type: "confirm",
      title: "ລົບ Recipe",
      msg: `ລົບ «${label}» ບໍ?`,
      data: { id },
      onConfirm: async () => {
        try {
          await apiClient.recipes.delete(id);
          setRecipes((p) => p.filter((recipe) => recipe.id !== id));
          toast("ລົບ Recipe ສຳເລັດ", "info");
          setModal(null);
        } catch (err) {
          console.error("Delete recipe failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const submitReceive = () => {
    if (!modal?.data) return;
    const data = modal.data;
    if (!data.qty || Number(data.qty) <= 0) {
      toast("ໃສ່ຈຳນວນ", "error");
      return;
    }
    setStock((p) =>
      p.map((s) =>
        s.id === data.id ? { ...s, cur: s.cur + Number(data.qty) } : s,
      ),
    );
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
      setSessions((p) => [created, ...p]);
      setModal(null);
      toast(`ສ້າງ ${created.id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Session creation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const requestPayment = (id: string) => {
    setSessions((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, status: "pending_payment", orderStatus: null }
          : x,
      ),
    );
    toast(`ຂໍການຊໍາລະ ${id}`, "info");
  };

  const confirmPayment = async (id: string) => {
    const session = sessions.find((x) => x.id === id);
    if (!session) return;
    const total = session.items.reduce(
      (sum, item) =>
        sum + (menu.find((m) => m.id === item.id)?.price ?? 0) * item.qty,
      0,
    );
    try {
      await apiClient.sales.create({
        table: session.id,
        items: session.items.length,
        total,
        time: now(),
        date: today(),
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
      setSales((p) => [
        {
          id: uid(p),
          table: session.id,
          items: session.items.length,
          total,
          time: now(),
          date: today(),
          sessionId: sessionNumericId,
        },
        ...p,
      ]);
      setSessions((p) => p.filter((x) => x.id !== id));
      setModal(null);
      toast(`ຊໍາລະ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Payment failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const cancelSession = (id: string) =>
    setModal({
      type: "confirm",
      title: "ຍົກເລີກ Bill",
      msg: `ຍົກເລີກ ${id} ຫຼື ບໍ?`,
      data: { id },
      onConfirm: async () => {
        try {
          const session = sessions.find((x) => x.id === id);
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
          setSessions((p) => p.filter((s) => s.id !== id));
          setModal(null);
          toast(`ຍົກເລີກ ${id}`, "info");
        } catch (err) {
          console.error("Cancel failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const revenueTotal = sales.reduce((sum, sale) => sum + sale.total, 0);
  const occupiedTablesCount = tables.filter(
    (t) => t.status === "occupied",
  ).length;
  const activeBillsCount = sessions.length;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "ຫຼັກ" },
    { id: "pos", icon: ShoppingCart, label: "POS" },
    { id: "menu", icon: Utensils, label: "ເມນູ" },
    { id: "recipes", icon: ClipboardList, label: "Recipe" },
    { id: "stock", icon: Package, label: "ຄັງ" },
    { id: "billing", icon: QrCode, label: "Bill" },
    { id: "reports", icon: BarChart2, label: "ລາຍງານ" },
    { id: "staff", icon: Users, label: "ພະນັກ" },
  ];

  const titles: Record<string, string> = {
    dashboard: "ພາບລວມ",
    pos: "ຈັດການໂຕະ",
    menu: "ເມນູ",
    recipes: "Recipe",
    stock: "ຄັງ",
    billing: "ບິນ",
    reports: "ລາຍງານ",
    staff: "ພະນັກ",
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: C.bg,
        fontFamily: "var(--sans)",
        color: C.text,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 66,
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14px 7px",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: C.goldDim,
            border: `1px solid ${C.borderMid}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            flexShrink: 0,
          }}
        >
          <ChefHat size={20} color={C.gold} />
        </div>
        {navItems.map((n) => (
          <NavBtn
            key={n.id}
            icon={n.icon}
            label={n.label}
            active={view === n.id}
            onClick={() => {
              setView(n.id);
              setSelTable(null);
              setShowAddItems(false);
            }}
          />
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: 9,
            color: loaded ? C.green : C.amber,
            textAlign: "center",
            paddingBottom: 6,
            letterSpacing: 0.5,
          }}
        >
          {loaded ? "● saved" : "● ..."}
        </div>
        <NavBtn
          icon={Settings}
          label="ຕັ້ງຄ່າ"
          active={false}
          onClick={() => {}}
        />
        <NavBtn icon={LogOut} label="ອອກ" active={false} onClick={() => {}} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 26px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.sidebar,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: C.textMid,
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              ໂອເລ້ເຂົ້າຊອຍ ຫຼວງພະບາງ
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                fontFamily: "var(--heading)",
                marginTop: 1,
              }}
            >
              {titles[view]}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                padding: "7px 13px",
              }}
            >
              <Search size={13} color={C.textDim} />
              <span style={{ fontSize: 12, color: C.textDim }}>ຄົ້ນຫາ...</span>
            </div>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={17} color={C.textMid} />
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.red,
                }}
              />
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg,${C.amber},${C.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ໂ
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: view === "pos" ? 0 : "22px 26px",
          }}
        >
          {view === "dashboard" && (
            <Dashboard sales={sales} tables={tables} menu={menu} />
          )}
          {view === "pos" && (
            <POS
              tables={tables}
              menu={menu}
              selTable={selTable}
              setSelTable={setSelTable}
              showAddItems={showAddItems}
              setShowAddItems={setShowAddItems}
              addItem={addItem}
              rmItem={rmItem}
              openTable={openTable}
              checkout={checkout}
            />
          )}
          {view === "billing" && (
            <BillingView
              sessions={sessions}
              menu={menu}
              setModal={setModal}
              requestPayment={requestPayment}
              confirmPayment={confirmPayment}
              cancelSession={cancelSession}
            />
          )}
          {view === "menu" && (
            <MenuView
              menu={menu}
              categories={categories}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              setModal={setModal}
              toggleOk={toggleOk}
              deleteMenu={deleteMenu}
            />
          )}
          {view === "recipes" && (
            <RecipeView
              recipes={recipes}
              menu={menu}
              ingredients={ingredients}
              setModal={setModal}
              deleteRecipe={deleteRecipe}
            />
          )}
          {view === "stock" && (
            <StockView
              stock={stock}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              setModal={setModal}
              deleteStock={deleteStock}
            />
          )}
          {view === "reports" && (
            <ReportsView
              sales={sales}
              tables={tables}
              revenueTotal={revenueTotal}
              activeBillsCount={activeBillsCount}
              occupiedTablesCount={occupiedTablesCount}
            />
          )}
          {view === "staff" && (
            <StaffView
              staff={staff}
              setModal={setModal}
              deleteStaff={deleteStaff}
            />
          )}
        </div>
      </div>

      {modal?.type === "menu-form" && (
        <Modal title={modal.title ?? "ເມນູ"} onClose={() => setModal(null)}>
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
              label="ຊື່ອັງກິດ"
              value={modal.data.en}
              onChange={(e) => setField("en", e.target.value)}
            />
            <Inp
              label="ລາຄາ (₭)"
              value={modal.data.price}
              onChange={(e) => setField("price", e.target.value)}
            />
            <Inp
              label="Emoji"
              value={modal.data.emoji}
              onChange={(e) => setField("emoji", e.target.value)}
            />
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMid,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 6,
                }}
              >
                Image
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  void handleMenuImageUpload(e.currentTarget.files?.[0] ?? null)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.card2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 9,
                  padding: "9px 12px",
                  color: C.text,
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "var(--sans)",
                }}
              />
              {modal.data.image ? (
                <div
                  style={{
                    marginTop: 10,
                    height: 120,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                    background: C.card2,
                  }}
                >
                  <img
                    src={modal.data.image}
                    alt="Menu preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <Sel
            label="ໝວດ"
            value={modal.data.cat}
            onChange={(e) => setField("cat", e.target.value)}
          >
            {categories.map((c) => (
              <option
                key={`${c.category_id || c.categoryId}-${c.category_name || c.categoryName || c.name}`}
                value={c.category_name || c.categoryName || c.name}
              >
                {c.category_name || c.categoryName || c.name}
              </option>
            ))}
          </Sel>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitMenu}>ບັນທຶກ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "staff-form" && (
        <Modal title={modal.title ?? "ພະນັກງານ"} onClose={() => setModal(null)}>
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
              label="Emoji"
              value={modal.data.emoji}
              onChange={(e) => setField("emoji", e.target.value)}
            />
            <Sel
              label="ຕໍາແໜ່ງ"
              value={modal.data.role}
              onChange={(e) => setField("role", e.target.value)}
            >
              <option value="ພະນັກງານ">ພະນັກງານ</option>
              <option value="ເຈົ້າຂອງ">ເຈົ້າຂອງ</option>
              <option value="ຫຸ້ນໄຟ">ຫຸ້ນໄຟ</option>
            </Sel>
            <Inp
              label="ເວລາເລີ່ມ"
              value={modal.data.since}
              onChange={(e) => setField("since", e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitStaff}>ບັນທຶກ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "recipe-form" && (
        <Modal title={modal.title ?? "Recipe"} onClose={() => setModal(null)}>
          <Sel
            label="ເມນູ"
            value={modal.data.menuId}
            onChange={(e) => setField("menuId", e.target.value)}
          >
            {menu.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Sel>
          <Sel
            label="ວັດຖຸດິບ"
            value={modal.data.ingredientId}
            onChange={(e) => setField("ingredientId", e.target.value)}
          >
            {ingredients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </Sel>
          <Inp
            label="ຈຳນວນທີ່ໃຊ້"
            type="number"
            min="0"
            step="0.01"
            value={modal.data.quantityUsed}
            onChange={(e) => setField("quantityUsed", e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitRecipe}>ບັນທຶກ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "session-form" && (
        <Modal title={modal.title ?? "Bill"} onClose={() => setModal(null)}>
          <Sel
            label="ປະເພດເຊດຊັນ"
            value={modal.data.sessionType}
            onChange={(e) => setField("sessionType", e.target.value)}
          >
            <option value="dine-in">ທານທີ່ຮ້ານ</option>
            <option value="takeaway">ກັບບ້ານ</option>
          </Sel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 12px",
            }}
          >
            <Inp
              label="ເລກໂຕະ"
              type="number"
              value={modal.data.tableNumber}
              onChange={(e) => setField("tableNumber", e.target.value)}
            />
            <Inp
              label="Staff ID"
              type="number"
              value={modal.data.staffId}
              onChange={(e) => setField("staffId", e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitSession}>ບັນທຶກ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "stock-form" && (
        <Modal title={modal.title ?? "ສິນຄ້າ"} onClose={() => setModal(null)}>
          <Inp
            label="ຊື່"
            value={modal.data.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 12px",
            }}
          >
            <Inp
              label="ຫົວໜ່ວຍ"
              value={modal.data.unit}
              onChange={(e) => setField("unit", e.target.value)}
            />
            <Inp
              label="ຈຳນວນ"
              type="number"
              value={modal.data.cur}
              onChange={(e) => setField("cur", e.target.value)}
            />
            <Inp
              label="ຫຼັກ"
              type="number"
              value={modal.data.min}
              onChange={(e) => setField("min", e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitStock}>ບັນທຶກ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "stock-receive" && (
        <Modal title={modal.title ?? "ຮັບເຂົ້າ"} onClose={() => setModal(null)}>
          <Inp
            label={`ຈຳນວນ (${modal.data.unit})`}
            type="number"
            value={modal.data.qty}
            onChange={(e) => setField("qty", e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              ຍົກເລີກ
            </Btn>
            <Btn onClick={submitReceive}>ຢືນຢັນ</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === "confirm" && (
        <Modal title={modal.title ?? "ຢືນຢັນ"} onClose={() => setModal(null)}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              padding: "10px 0",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(208,64,48,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={22} color={C.red} />
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.textMid,
                textAlign: "center",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {modal.msg}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>
                ຍົກເລີກ
              </Btn>
              <Btn
                variant="danger"
                onClick={modal.onConfirm ?? (() => setModal(null))}
              >
                ຢືນຢັນ
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === "qr-display" && (
        <Modal title={modal.title ?? "QR Bill"} onClose={() => setModal(null)}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ background: C.card2, borderRadius: 16, padding: 18 }}>
              <img
                src={QR_URL(modal.data.id)}
                width={160}
                height={160}
                alt={modal.data.id}
                style={{ display: "block", borderRadius: 14 }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
                {modal.data.id}
              </div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
                {modal.data.createdAt}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>
                ປິດ
              </Btn>
              <Btn onClick={() => setModal(null)}>ບັນທຶກ</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 1100,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.card2,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "12px 16px",
              minWidth: 260,
            }}
          >
            {t.type === "error" ? (
              <AlertTriangle size={15} color={C.red} />
            ) : (
              <CheckCircle size={15} color={C.green} />
            )}
            <span style={{ fontSize: 13, color: C.text }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
