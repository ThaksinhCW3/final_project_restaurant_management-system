import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  C,
  today,
  now,
  uid,
  kip,
} from "./config/constants";
import { NavBtn } from "./components/SharedUI";
import {
  ConfirmModal,
  MenuFormModal,
  QrDisplayModal,
  SessionFormModal,
  StaffFormModal,
  StockFormModal,
  StockReceiveModal,
} from "./components/modals";
import Dashboard from "./views/Dashboard";
import {
  BillingView,
  MenuView,
  ReportsView,
  StaffView,
  StockView,
} from "./views/ManagementPages";
import POS from "./views/POS";
import type {
  MenuItem,
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
import "./App.css";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };

export default function App() {
  const [view, setView] = useState<string>("dashboard");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  const [selSession, setSelSession] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("ທັງໝົດ");
  const [showAddItems, setShowAddItems] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [modal, setModal] = useState<AppModalState>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const paymentLocks = useRef(new Set<string>());

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

  const addMenuRecipeRow = (ingredientId?: number | string) =>
    setModal((prev) =>
      prev
        ? {
            ...prev,
            data: {
              ...prev.data,
              recipeItems: [
                ...(prev.data.recipeItems ?? []),
                {
                  ingredientId: ingredientId ?? ingredients[0]?.id ?? "",
                  quantityUsed: "",
                },
              ],
            },
          }
        : prev,
    );

  const setMenuRecipeField = (index: number, field: string, value: any) =>
    setModal((prev) => {
      if (!prev) return prev;
      const recipeItems = [...(prev.data.recipeItems ?? [])];
      recipeItems[index] = { ...recipeItems[index], [field]: value };
      return { ...prev, data: { ...prev.data, recipeItems } };
    });

  const removeMenuRecipeRow = (index: number) =>
    setModal((prev) => {
      if (!prev) return prev;
      const recipeItems = [...(prev.data.recipeItems ?? [])];
      recipeItems.splice(index, 1);
      return { ...prev, data: { ...prev.data, recipeItems } };
    });

  const handleImageUpload = async (file: File | null, field = "image") => {
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
      prev ? { ...prev, data: { ...prev.data, [field]: image } } : prev,
    );
  };

  const saveSessionItems = async (
    sessionId: string,
    items: SessionItem["items"],
  ) => {
    await apiClient.sessions.replaceItems(sessionId, items);
  };

  const addItem = async (sessionId: string, menuId: number) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session || session.status === "pending_payment") return;

    const existing = session.items.find((item) => item.id === menuId);
    const items = existing
      ? session.items.map((item) =>
          item.id === menuId ? { ...item, qty: item.qty + 1 } : item,
        )
      : [...session.items, { id: menuId, qty: 1 }];

    setSessions((prev) =>
      prev.map((item) => (item.id === sessionId ? { ...item, items } : item)),
    );

    try {
      await saveSessionItems(sessionId, items);
    } catch (err) {
      console.error("Save session items failed", err);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, items: session.items } : item,
        ),
      );
      toast("Could not save bill items", "error");
    }
  };

  const rmItem = async (sessionId: string, menuId: number) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session || session.status === "pending_payment") return;

    const existing = session.items.find((item) => item.id === menuId);
    if (!existing) return;

    const items =
      existing.qty > 1
        ? session.items.map((item) =>
            item.id === menuId ? { ...item, qty: item.qty - 1 } : item,
          )
        : session.items.filter((item) => item.id !== menuId);

    setSessions((prev) =>
      prev.map((item) => (item.id === sessionId ? { ...item, items } : item)),
    );

    try {
      await saveSessionItems(sessionId, items);
    } catch (err) {
      console.error("Save session items failed", err);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, items: session.items } : item,
        ),
      );
      toast("Could not save bill items", "error");
    }
  };

  const showQr = (session: SessionItem) =>
    setModal({
      type: "qr-display",
      title: "QR Bill",
      data: session,
    });

  const createBill = () =>
    setModal({
      type: "session-form",
      title: "Generate QR Bill",
      data: { sessionType: "dine-in", note: "", staffId: "" },
    });

  const openTable = async (id: number) => {
    void id;
    createBill();
    return;
    /*
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

    */
  };

  const checkout = async (id: number) => {
    void id;
    return;
    /*
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

    */
  };

  void openTable;
  void checkout;

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

  const syncMenuRecipes = async (menuId: number, recipeItems: any[] = []) => {
    const validItems = recipeItems.filter(
      (item) => item.ingredientId && item.quantityUsed !== "",
    );
    const existingItems = recipes.filter((recipe) => recipe.menuId === menuId);
    const savedItems: RecipeItem[] = [];

    for (const item of validItems) {
      const ingredientId = Number(item.ingredientId);
      const quantityUsed = Number(item.quantityUsed);
      const ingredient = ingredients.find((entry) => entry.id === ingredientId);
      const menuItem = menu.find((entry) => entry.id === menuId);
      const recipeData = {
        menuId,
        ingredientId,
        quantityUsed,
      };
      const normalized = {
        ...recipeData,
        menuName: String(modal?.data?.name ?? menuItem?.name ?? "Menu item"),
        ingredientName: ingredient?.name ?? "Ingredient",
        unit: ingredient?.unit ?? null,
      };

      if (item.id) {
        await apiClient.recipes.update(item.id, recipeData);
        savedItems.push({ id: item.id, ...normalized });
      } else {
        const result = await apiClient.recipes.create(recipeData);
        savedItems.push({ id: result.data.recipe_id, ...normalized });
      }
    }

    const validIds = new Set(validItems.map((item) => item.id).filter(Boolean));
    for (const recipe of existingItems) {
      if (!validIds.has(recipe.id)) {
        await apiClient.recipes.delete(recipe.id);
      }
    }

    setRecipes((current) => [
      ...current.filter((recipe) => recipe.menuId !== menuId),
      ...savedItems,
    ]);
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
      let savedMenuId = Number(data.id || 0);
      if (data.id) {
        await apiClient.menus.update(data.id, cleaned);
        savedMenuId = Number(data.id);
        setMenu((p) =>
          p.map((m) => (m.id === data.id ? { ...m, ...cleaned } : m)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.menus.create(cleaned);
        savedMenuId = Number(result.data.menu_id ?? result.data.menuId);
        setMenu((p) => [...p, { ...cleaned, id: savedMenuId }]);
        toast(`ເພີ່ມ «${data.name}»`);
      }
      await syncMenuRecipes(savedMenuId, data.recipeItems ?? []);
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
    const note = String(data.note ?? "").trim();
    try {
      const created = await apiClient.sessions.create({
        sessionType: data.sessionType ?? "dine-in",
        note,
        tableNumber: null,
        staffId: data.staffId ?? null,
        status: "Active",
      });
      setSessions((p) => [created, ...p]);
      setSelSession(created.id);
      setModal({ type: "qr-display", title: "QR Bill", data: created });
      toast(`ສ້າງ ${created.id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Session creation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const requestPayment = async (id: string) => {
    const session = sessions.find((x) => x.id === id);
    if (!session) return;

    try {
      await apiClient.sessions.update(id, {
        sessionType: session.sessionType ?? "dine-in",
        note: session.note,
        tableNumber: null,
        staffId: session.staffId ?? null,
        status: "PendingPayment",
      });
    } catch (err) {
      console.error("Request payment failed", err);
      toast("Could not request payment", "error");
      return;
    }

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
    if (paymentLocks.current.has(id)) return;

    const session = sessions.find((x) => x.id === id);
    if (!session) return;
    const sessionNumericId = parseSessionId(session.id);
    if (sessionNumericId === null) {
      toast("Invalid bill id", "error");
      return;
    }

    paymentLocks.current.add(id);

    const total = session.items.reduce(
      (sum, item) =>
        sum + (menu.find((m) => m.id === item.id)?.price ?? 0) * item.qty,
      0,
    );
    try {
      const saleAlreadyExists = sales.some(
        (sale) => sale.sessionId === sessionNumericId,
      );
      const saleRecord = {
        id: uid(sales),
        table: session.id,
        items: session.items.length,
        total,
        time: now(),
        date: today(),
        sessionId: sessionNumericId,
      };

      if (!saleAlreadyExists) {
        await apiClient.sales.create({
          table: session.id,
          items: session.items.length,
          total,
          time: saleRecord.time,
          date: saleRecord.date,
          sessionId: sessionNumericId,
        });
        setSales((p) =>
          p.some((sale) => sale.sessionId === sessionNumericId)
            ? p
            : [saleRecord, ...p],
        );
      }

      await apiClient.sessions.update(sessionNumericId, {
        sessionType: session.sessionType ?? "dine-in",
        note: session.note,
        tableNumber: null,
        staffId: session.staffId ?? null,
        status: "Completed",
        endedAt: new Date().toISOString(),
      });
      setSessions((p) => p.filter((x) => x.id !== id));
      if (selSession === id) setSelSession(null);
      setModal(null);
      paymentLocks.current.delete(id);
      toast(`ຊໍາລະ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Payment failed", err);
      paymentLocks.current.delete(id);
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
              note: session.note,
              tableNumber: null,
              staffId: session.staffId ?? null,
              status: "Completed",
              endedAt: new Date().toISOString(),
            });
          }
          setSessions((p) => p.filter((s) => s.id !== id));
          if (selSession === id) setSelSession(null);
          setModal(null);
          toast(`ຍົກເລີກ ${id}`, "info");
        } catch (err) {
          console.error("Cancel failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const revenueTotal = sales.reduce((sum, sale) => sum + sale.total, 0);
  const activeBillsCount = sessions.length;
  const pendingBillsCount = sessions.filter(session => session.status === "pending_payment").length;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "ຫຼັກ" },
    { id: "pos", icon: ShoppingCart, label: "POS" },
    { id: "menu", icon: Utensils, label: "ເມນູ" },
    { id: "stock", icon: Package, label: "ຄັງ" },
    { id: "billing", icon: QrCode, label: "Bill" },
    { id: "reports", icon: BarChart2, label: "ລາຍງານ" },
    { id: "staff", icon: Users, label: "ພະນັກ" },
  ];

  const titles: Record<string, string> = {
    dashboard: "ພາບລວມ",
    pos: "ຈັດການໂຕະ",
    menu: "ເມນູ",
    stock: "ຄັງ",
    billing: "ບິນ",
    reports: "ລາຍງານ",
    staff: "ພະນັກ",
  };

  const billId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("bill")
      : null;
  const customerSession = billId
    ? sessions.find((session) => session.id === billId)
    : null;

  if (billId) {
    const billTotal = customerSession
      ? customerSession.items.reduce(
          (sum, item) =>
            sum + (menu.find((entry) => entry.id === item.id)?.price ?? 0) * item.qty,
          0,
        )
      : 0;
    const waitingPayment = customerSession?.status === "pending_payment";

    return (
      <div className="customer-page">
        <div className="customer-shell">
          <div className="customer-header">
            <div>
              <div className="customer-kicker">Olay Khao Soi</div>
              <div className="customer-bill-id">{billId}</div>
              <div className="customer-note">{customerSession?.note || "Customer bill"}</div>
            </div>
            <div className="customer-total">
              <div className="customer-total-label">Total</div>
              <div className="customer-total-value">{kip(billTotal)}</div>
            </div>
          </div>

          {!loaded ? (
            <div className="customer-message">
              Loading bill...
            </div>
          ) : !customerSession ? (
            <div className="customer-message">
              This QR bill is closed or no longer available.
            </div>
          ) : (
            <div className="customer-grid">
              <div className="customer-menu-grid">
                {menu.filter((item) => item.ok).map((item) => (
                  <button
                    key={item.id}
                    className="customer-menu-card"
                    disabled={waitingPayment}
                    onClick={() => addItem(customerSession.id, item.id)}
                  >
                    <div className="customer-menu-emoji">{item.emoji}</div>
                    <div className="customer-menu-name">{item.name}</div>
                    <div className="customer-menu-en">{item.en}</div>
                    <div className="customer-menu-price">{kip(item.price)}</div>
                  </button>
                ))}
              </div>

              <div className="customer-bill-card">
                <div className="customer-bill-title">Your bill</div>
                {customerSession.items.length === 0 ? (
                  <div className="customer-empty">No items yet.</div>
                ) : (
                  customerSession.items.map((item) => {
                    const menuItem = menu.find((entry) => entry.id === item.id);
                    if (!menuItem) return null;

                    return (
                      <div key={item.id} className="customer-bill-row">
                        <div className="customer-bill-item">
                          <div className="customer-bill-name">{menuItem.name}</div>
                          <div className="customer-bill-price">{kip(menuItem.price)}</div>
                        </div>
                        <button className="customer-qty-btn customer-qty-btn--minus" disabled={waitingPayment} onClick={() => rmItem(customerSession.id, item.id)}>-</button>
                        <span className="customer-qty">{item.qty}</span>
                        <button className="customer-qty-btn customer-qty-btn--plus" disabled={waitingPayment} onClick={() => addItem(customerSession.id, item.id)}>+</button>
                      </div>
                    );
                  })
                )}

                {waitingPayment ? (
                  <div className="customer-waiting">
                    Waiting for staff confirmation
                  </div>
                ) : (
                  <button
                    className="customer-payment-btn"
                    onClick={() => requestPayment(customerSession.id)}
                    disabled={customerSession.items.length === 0}
                  >
                    Request payment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <div className="app-logo">
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
              setSelSession(null);
              setShowAddItems(false);
            }}
          />
        ))}
        <div className="app-sidebar-spacer" />
        <div className={`app-sync ${loaded ? "app-sync--saved" : "app-sync--loading"}`}>
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

      <div className="app-main">
        <div className="app-header">
          <div>
            <div className="app-kicker">
              ໂອເລ້ເຂົ້າຊອຍ ຫຼວງພະບາງ
            </div>
            <div className="app-title">
              {titles[view]}
            </div>
          </div>
          <div className="app-header-actions">
            <div className="app-search">
              <Search size={13} color={C.textDim} />
              <span className="app-search-text">ຄົ້ນຫາ...</span>
            </div>
            <div className="app-notification">
              <Bell size={17} color={C.textMid} />
              <div className="app-notification-dot" />
            </div>
            <div className="app-avatar">
              ໂ
            </div>
          </div>
        </div>

        <div className={`app-content ${view === "pos" ? "app-content--pos" : ""}`}>
          {view === "dashboard" && (
            <Dashboard sales={sales} sessions={sessions} menu={menu} />
          )}
          {view === "pos" && (
            <POS
              sessions={sessions}
              menu={menu}
              selectedSessionId={selSession}
              setSelectedSessionId={setSelSession}
              showAddItems={showAddItems}
              setShowAddItems={setShowAddItems}
              createBill={createBill}
              showQr={showQr}
              addItem={addItem}
              rmItem={rmItem}
              requestPayment={requestPayment}
              confirmPayment={confirmPayment}
              cancelSession={cancelSession}
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
              recipes={recipes}
              categories={categories}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              setModal={setModal}
              toggleOk={toggleOk}
              deleteMenu={deleteMenu}
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
              revenueTotal={revenueTotal}
              activeBillsCount={activeBillsCount}
              pendingBillsCount={pendingBillsCount}
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
        <MenuFormModal
          modal={modal}
          categories={categories}
          ingredients={ingredients}
          onClose={() => setModal(null)}
          setField={setField}
          addMenuRecipeRow={addMenuRecipeRow}
          setMenuRecipeField={setMenuRecipeField}
          removeMenuRecipeRow={removeMenuRecipeRow}
          submitMenu={submitMenu}
        />
      )}

      {modal?.type === "staff-form" && (
        <StaffFormModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          submitStaff={submitStaff}
        />
      )}

      {modal?.type === "session-form" && (
        <SessionFormModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          submitSession={submitSession}
        />
      )}

      {modal?.type === "stock-form" && (
        <StockFormModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          handleImageUpload={handleImageUpload}
          submitStock={submitStock}
        />
      )}

      {modal?.type === "stock-receive" && (
        <StockReceiveModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          submitReceive={submitReceive}
        />
      )}

      {modal?.type === "confirm" && (
        <ConfirmModal modal={modal} onClose={() => setModal(null)} />
      )}

      {modal?.type === "qr-display" && (
        <QrDisplayModal modal={modal} onClose={() => setModal(null)} />
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-item"
          >
            {t.type === "error" ? (
              <AlertTriangle size={15} color={C.red} />
            ) : (
              <CheckCircle size={15} color={C.green} />
            )}
            <span className="toast-text">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

