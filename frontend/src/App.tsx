import { useState, useEffect, useRef, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
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
  parseCurrency,
} from "./config/constants";
import { NavBtn } from "./components/SharedUI";
import {
  CategoryFormModal,
  CategoryManagerModal,
  ConfirmModal,
  MenuFormModal,
  QrDisplayModal,
  SessionFormModal,
  StaffFormModal,
  StockFormModal,
  StockReceiveModal,
  SupplierManagerModal,
} from "./components/modals";
import Dashboard from "./views/Dashboard";
import CustomerPage from "./views/CustomerPage";
import {
  BillingView,
  MenuView,
  ReportsView,
  SalesHistoryView,
  StaffView,
  StockView,
} from "./views/ManagementPages";
import POS from "./views/POS";
import type {
  MenuItem,
  SaleItem,
  StaffItem,
  StockItem,
  SupplierItem,
  SupplyOrderDetailItem,
  SupplyOrderItem,
  TableItem,
  SessionItem,
  IngredientItem,
  RecipeItem,
} from "./types";
import type { AppModalState } from "./types/app";
import { apiClient } from "./api/client";
import "./index.css";
import "./App.css";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };
type AuthUser = {
  id: number;
  name: string;
  role: string;
  username?: string | null;
  token: string;
};

const AUTH_STORAGE_KEY = "olay-auth-user";

const readStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const roleLabel = (role?: string | null) =>
  role === "manager" ? "ຜູ້ຈັດການ" : "ພະນັກງານ";

const getApiErrorInfo = (err: unknown) => {
  const maybeError = err as {
    response?: {
      status?: number;
      data?: {
        error?: string;
        message?: string;
      };
    };
  };

  return {
    status: maybeError.response?.status,
    message:
      maybeError.response?.data?.error ??
      maybeError.response?.data?.message ??
      "",
  };
};

export default function App() {
  const [view, setView] = useState<string>("dashboard");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrderItem[]>([]);
  const [supplyOrderDetails, setSupplyOrderDetails] = useState<SupplyOrderDetailItem[]>([]);

  const [selSession, setSelSession] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("ທັງໝົດ");
  const [showAddItems, setShowAddItems] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const [searchSuggestionsClosing, setSearchSuggestionsClosing] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState<number>(66);
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);
  const [modal, setModal] = useState<AppModalState>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    readStoredUser(),
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const paymentLocks = useRef(new Set<string>());
  const isAdmin = currentUser?.role === "manager";

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
        apiClient.tables.getAll(),
        apiClient.sessions.getAll(),
        apiClient.sales.getAll(),
        apiClient.categories.getAll(),
        apiClient.ingredients.getAll(),
        apiClient.recipes.getAll(),
        apiClient.suppliers.getAll(),
        apiClient.supplyOrders.getAll(),
        apiClient.supplyOrderDetails.getAll(),
      ]);

      const [
        menusRes,
        staffRes,
        stockRes,
        tablesRes,
        sessionsRes,
        salesRes,
        categoriesRes,
        ingredientsRes,
        recipesRes,
        suppliersRes,
        supplyOrdersRes,
        supplyOrderDetailsRes,
      ] = results;

      if (menusRes.status === "fulfilled") setMenu(menusRes.value || []);
      else console.error("Failed to load menus", menusRes.reason);

      if (staffRes.status === "fulfilled") setStaff(staffRes.value || []);
      else console.error("Failed to load staff", staffRes.reason);

      if (stockRes.status === "fulfilled") setStock(stockRes.value || []);
      else console.error("Failed to load stock", stockRes.reason);

      if (tablesRes.status === "fulfilled") setTables(tablesRes.value || []);
      else console.error("Failed to load tables", tablesRes.reason);

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

      if (suppliersRes.status === "fulfilled")
        setSuppliers(suppliersRes.value || []);
      else console.error("Failed to load suppliers", suppliersRes.reason);

      if (supplyOrdersRes.status === "fulfilled")
        setSupplyOrders(supplyOrdersRes.value || []);
      else console.error("Failed to load supply orders", supplyOrdersRes.reason);

      if (supplyOrderDetailsRes.status === "fulfilled")
        setSupplyOrderDetails(supplyOrderDetailsRes.value || []);
      else console.error("Failed to load supply order details", supplyOrderDetailsRes.reason);

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    apiClient.auth.setToken(currentUser?.token ?? null);
  }, [currentUser?.token]);

  // Data is now persisted via API - no need for localStorage

  const toast = (msg: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = loginForm.username.trim();
    const password = loginForm.password;

    if (!username || !password) {
      setLoginError("ໃສ່ຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await apiClient.auth.login({ username, password });
      const user: AuthUser = {
        ...result.staff,
        token: result.token,
      };

      apiClient.auth.setToken(user.token);
      setCurrentUser(user);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      console.error("Login failed", err);
      setLoginError("ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    apiClient.auth.setToken(null);
    setCurrentUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setView("dashboard");
    setModal(null);
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

  const addMenuOptionGroup = () =>
    setModal((prev) =>
      prev
        ? {
            ...prev,
            data: {
              ...prev.data,
              optionGroups: [
                ...(prev.data.optionGroups ?? []),
                {
                  id: `group-${Date.now()}`,
                  name: "",
                  selectionType: "single",
                  required: false,
                  values: [{ id: `value-${Date.now()}`, name: "", priceDelta: "" }],
                },
              ],
            },
          }
        : prev,
    );

  const setMenuOptionGroupField = (groupIndex: number, field: string, value: any) =>
    setModal((prev) => {
      if (!prev) return prev;
      const optionGroups = [...(prev.data.optionGroups ?? [])];
      optionGroups[groupIndex] = { ...optionGroups[groupIndex], [field]: value };
      return { ...prev, data: { ...prev.data, optionGroups } };
    });

  const removeMenuOptionGroup = (groupIndex: number) =>
    setModal((prev) => {
      if (!prev) return prev;
      const optionGroups = [...(prev.data.optionGroups ?? [])];
      optionGroups.splice(groupIndex, 1);
      return { ...prev, data: { ...prev.data, optionGroups } };
    });

  const addMenuOptionValue = (groupIndex: number) =>
    setModal((prev) => {
      if (!prev) return prev;
      const optionGroups = [...(prev.data.optionGroups ?? [])];
      const group = optionGroups[groupIndex];
      optionGroups[groupIndex] = {
        ...group,
        values: [
          ...(group.values ?? []),
          { id: `value-${Date.now()}`, name: "", priceDelta: "" },
        ],
      };
      return { ...prev, data: { ...prev.data, optionGroups } };
    });

  const setMenuOptionValueField = (groupIndex: number, valueIndex: number, field: string, value: any) =>
    setModal((prev) => {
      if (!prev) return prev;
      const optionGroups = [...(prev.data.optionGroups ?? [])];
      const group = optionGroups[groupIndex];
      const values = [...(group.values ?? [])];
      values[valueIndex] = { ...values[valueIndex], [field]: value };
      optionGroups[groupIndex] = { ...group, values };
      return { ...prev, data: { ...prev.data, optionGroups } };
    });

  const removeMenuOptionValue = (groupIndex: number, valueIndex: number) =>
    setModal((prev) => {
      if (!prev) return prev;
      const optionGroups = [...(prev.data.optionGroups ?? [])];
      const group = optionGroups[groupIndex];
      const values = [...(group.values ?? [])];
      values.splice(valueIndex, 1);
      optionGroups[groupIndex] = { ...group, values };
      return { ...prev, data: { ...prev.data, optionGroups } };
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

  const addItem = async (sessionId: string, menuId: number, quantity = 1) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session || session.status === "pending_payment") return;

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const existing = session.items.find((item) => item.id === menuId);
    const items = existing
      ? session.items.map((item) =>
          item.id === menuId ? { ...item, qty: item.qty + safeQuantity } : item,
        )
      : [...session.items, { id: menuId, qty: safeQuantity }];

    setSessions((prev) =>
      prev.map((item) => (item.id === sessionId ? { ...item, items } : item)),
    );

    try {
      await saveSessionItems(sessionId, items);
    } catch (err) {
      console.error("Save session items failed", err);
      const apiError = getApiErrorInfo(err);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, items: session.items } : item,
        ),
      );
      toast(apiError.message || "ບັນທຶກລາຍການບິນບໍ່ສຳເລັດ", "error");
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
      const apiError = getApiErrorInfo(err);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, items: session.items } : item,
        ),
      );
      toast(apiError.message || "ບັນທຶກລາຍການບິນບໍ່ສຳເລັດ", "error");
    }
  };

  const showQr = (session: SessionItem) =>
    setModal({
      type: "qr-display",
      title: "ບິນ QR",
      data: session,
    });

  const refreshTables = async () => {
    const nextTables = await apiClient.tables.getAll();
    setTables(nextTables);
    return nextTables;
  };

  const createTable = async (data: { tableNumber: string; seats: string; zone?: string }) => {
    try {
      await apiClient.tables.create({
        tableNumber: data.tableNumber,
        seats: data.seats,
        zone: data.zone ?? null,
      });
      await refreshTables();
      toast(`ສ້າງໂຕະ ${data.tableNumber} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Create table failed", err);
      toast("ສ້າງໂຕະບໍ່ສຳເລັດ", "error");
      throw err;
    }
  };

  const deleteTable = async (id: number) => {
    try {
      await apiClient.tables.delete(id);
      await refreshTables();
      toast(`ລຶບໂຕະ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Delete table failed", err);
      toast("ລຶບໂຕະບໍ່ສຳເລັດ", "error");
    }
  };

  const createBill = () => {
    const firstFreeTable = tables.find((table) => table.status === "free");
    setModal({
      type: "session-form",
      title: "ສ້າງບິນ QR",
      data: {
        sessionType: "dine-in",
        note: "",
        tableNumber: firstFreeTable?.id ? String(firstFreeTable.id) : "",
        staffId: currentUser?.id ?? "",
      },
    });
  };

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
    const selectedCategoryId =
      data.categoryId == null || data.categoryId === ""
        ? null
        : Number(data.categoryId);
    const selectedCategoryName = String(data.cat ?? data.category_name ?? "");
    const category =
      selectedCategoryId !== null
        ? categories.find((c) => Number(c.category_id ?? c.id ?? c.categoryId) === selectedCategoryId)
        : categories.find((c) => {
            const categoryName = c.category_name ?? c.categoryName ?? c.name;
            return categoryName === selectedCategoryName;
          });
    const categoryName =
      category?.category_name ?? category?.categoryName ?? category?.name ?? selectedCategoryName;
    const cleanedOptionGroups = (data.optionGroups ?? [])
      .map((group: any) => ({
        ...group,
        name: String(group.name ?? "").trim(),
        values: (group.values ?? [])
          .map((value: any) => ({
            ...value,
            name: String(value.name ?? "").trim(),
            priceDelta: parseCurrency(value.priceDelta || 0),
          }))
          .filter((value: any) => value.name),
      }))
      .filter((group: any) => group.name || group.values.length);
    const invalidOptionGroup = cleanedOptionGroups.find(
      (group: any) => !group.name || group.values.length === 0,
    );

    if (invalidOptionGroup) {
      toast("ໃສ່ຊື່ option ແລະ value ຢ່າງໜ້ອຍ 1 ລາຍການ", "error");
      return;
    }

    const cleaned = {
      ...data,
      price: parseCurrency(data.price),
      cat: categoryName,
      sold: data.sold ?? 0,
      ok: Boolean(data.ok),
      emoji: data.emoji || "🍜",
      categoryId:
        category?.category_id ?? category?.id ?? category?.categoryId ?? null,
      optionGroups: cleanedOptionGroups,
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

  const submitCategory = async () => {
    if (!modal?.data) return;
    const categoryName = String(
      modal.data.name ?? modal.data.category_name ?? "",
    ).trim();

    if (!categoryName) {
      toast("ໃສ່ຊື່ໝວດ", "error");
      return;
    }

    const editingId = modal.data.id ?? modal.data.category_id ?? modal.data.categoryId;
    const exists = categories.some((category) => {
      const categoryId = category.category_id ?? category.categoryId ?? category.id;
      const name = String(
        category.category_name ?? category.categoryName ?? category.name ?? "",
      ).trim();
      return (
        Number(categoryId) !== Number(editingId) &&
        name.toLocaleLowerCase() === categoryName.toLocaleLowerCase()
      );
    });

    if (exists) {
      toast("ໝວດນີ້ມີແລ້ວ", "error");
      return;
    }

    try {
      if (editingId) {
        await updateCategory(Number(editingId), categoryName);
        setModal(null);
        return;
      }

      const result = await apiClient.categories.create({
        category_name: categoryName,
      });
      const saved = result.data ?? {};
      const savedId = saved.category_id ?? saved.categoryId ?? Date.now();
      const savedName =
        saved.category_name ?? saved.categoryName ?? categoryName;
      const category = {
        id: savedId,
        category_id: savedId,
        name: savedName,
        category_name: savedName,
      };

      setCategories((current) => [...current, category]);
      setActiveCat(savedName);
      toast(`ເພີ່ມໝວດ «${savedName}»`);
      setModal(null);
    } catch (err) {
      console.error("Category operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const updateCategory = async (id: number, categoryName: string) => {
    const nextName = categoryName.trim();
    if (!nextName) {
      toast("ໃສ່ຊື່ໝວດ", "error");
      return;
    }

    const currentCategory = categories.find(
      (category) => Number(category.category_id ?? category.categoryId ?? category.id) === id,
    );
    const oldName = String(
      currentCategory?.category_name ?? currentCategory?.categoryName ?? currentCategory?.name ?? "",
    );
    const exists = categories.some((category) => {
      const categoryId = Number(category.category_id ?? category.categoryId ?? category.id);
      const name = String(category.category_name ?? category.categoryName ?? category.name ?? "").trim();
      return categoryId !== id && name.toLocaleLowerCase() === nextName.toLocaleLowerCase();
    });

    if (exists) {
      toast("ໝວດນີ້ມີແລ້ວ", "error");
      return;
    }

    try {
      await apiClient.categories.update(id, { category_name: nextName });
      setCategories((current) =>
        current.map((category) =>
          Number(category.category_id ?? category.categoryId ?? category.id) === id
            ? {
                ...category,
                id,
                category_id: id,
                name: nextName,
                category_name: nextName,
                categoryName: nextName,
              }
            : category,
        ),
      );
      setMenu((current) =>
        current.map((item) =>
          item.categoryId === id || item.cat === oldName
            ? { ...item, cat: nextName }
            : item,
        ),
      );
      if (activeCat === oldName) setActiveCat(nextName);
      toast(`ອັບເດດໝວດ «${nextName}»`);
    } catch (err) {
      console.error("Category update failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const deleteCategory = async (id: number, name: string) => {
    try {
      await apiClient.categories.delete(id);
      setCategories((current) =>
        current.filter((category) => Number(category.category_id ?? category.categoryId ?? category.id) !== id),
      );
      setMenu((current) =>
        current.map((item) =>
          item.categoryId === id || item.cat === name
            ? { ...item, categoryId: null, cat: "ບໍ່ມີໝວດ" }
            : item,
        ),
      );
      if (activeCat === name) setActiveCat("ທັງໝົດ");
      toast(`ລົບໝວດ «${name}»`, "info");
    } catch (err) {
      console.error("Category delete failed", err);
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
    if (!isAdmin) {
      toast("ສຳລັບຜູ້ຈັດການເທົ່ານັ້ນ", "error");
      return;
    }

    const username = String(data.username ?? "").trim();
    const password = String(data.password ?? "");

    if (!data.name || !username || (!data.id && !password)) {
      toast("ໃສ່ຊື່, ຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ", "error");
      return;
    }

    const staffPayload = {
      ...data,
      username,
      password: password || undefined,
      orders: Number(data.orders || 0),
    };
    const visibleStaff = { ...staffPayload };
    delete (visibleStaff as { password?: string }).password;

    try {
      if (data.id) {
        await apiClient.staff.update(data.id, staffPayload);
        setStaff((p) =>
          p.map((s) => (s.id === data.id ? { ...s, ...visibleStaff } : s)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.staff.create(staffPayload);
        const saved = result.data ?? {};
        setStaff((p) => [
          ...p,
          {
            ...visibleStaff,
            id: saved.staff_id ?? saved.staffId ?? saved.id,
            role: saved.role ?? visibleStaff.role,
            username: saved.username ?? visibleStaff.username,
            since: saved.username ?? visibleStaff.username ?? "—",
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
    isAdmin
      ? setModal({
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
        })
      : toast("ສຳລັບຜູ້ຈັດການເທົ່ານັ້ນ", "error");

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
      costPerUnit: parseCurrency(data.costPerUnit ?? 0),
      supplierId: data.supplierId === "" || data.supplierId == null ? null : Number(data.supplierId),
    };
    const supplierName = suppliers.find((supplier) => supplier.id === cleaned.supplierId)?.name ?? null;
    try {
      if (data.id) {
        await apiClient.stock.update(data.id, cleaned);
        setStock((p) =>
          p.map((s) => (s.id === data.id ? { ...s, ...cleaned, supplierName } : s)),
        );
        toast(`ອັບເດດ «${data.name}»`);
      } else {
        const result = await apiClient.stock.create(cleaned);
        setStock((p) => [...p, { ...cleaned, supplierName, id: result.data.id }]);
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

  const submitSupplier = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    const name = String(data.name ?? "").trim();

    if (!name) {
      toast("ໃສ່ຊື່ຜູ້ສະໜອງ", "error");
      return;
    }

    const payload = {
      name,
      phone: String(data.phone ?? "").trim(),
    };

    try {
      if (data.id) {
        await apiClient.suppliers.update(data.id, payload);
        setSuppliers((current) =>
          current.map((supplier) =>
            supplier.id === data.id ? { ...supplier, ...payload } : supplier,
          ),
        );
        setStock((current) =>
          current.map((item) =>
            item.supplierId === data.id ? { ...item, supplierName: payload.name } : item,
          ),
        );
        toast(`ອັບເດດ «${name}»`);
      } else {
        const result = await apiClient.suppliers.create(payload);
        const id = Number(result.data.supplier_id ?? result.data.supplierId ?? result.data.id);
        setSuppliers((current) => [...current, { id, ...payload }]);
        toast(`ເພີ່ມ «${name}»`);
      }
      setField("id", undefined);
      setField("name", "");
      setField("phone", "");
    } catch (err) {
      console.error("Supplier operation failed", err);
      toast("ຜິດພາດ", "error");
    }
  };

  const editSupplier = (supplier: SupplierItem) => {
    setModal({
      type: "supplier-manager",
      title: "ຜູ້ສະໜອງ",
      data: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone ?? "",
      },
    });
  };

  const deleteSupplier = (supplier: SupplierItem) =>
    setModal({
      type: "confirm",
      title: "ລົບຜູ້ສະໜອງ",
      msg: `ລົບ «${supplier.name}» ບໍ?`,
      data: { id: supplier.id },
      onConfirm: async () => {
        try {
          await apiClient.suppliers.delete(supplier.id);
          setSuppliers((current) => current.filter((item) => item.id !== supplier.id));
          setModal({
            type: "supplier-manager",
            title: "ຜູ້ສະໜອງ",
            data: { name: "", phone: "" },
          });
          toast(`ລົບ «${supplier.name}»`, "info");
        } catch (err) {
          console.error("Supplier delete failed", err);
          toast("ຜິດພາດ", "error");
        }
      },
    });

  const submitReceive = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    try {
      const staffId = staff.some((item) => item.id === currentUser?.id)
        ? currentUser?.id
        : staff[0]?.id ?? currentUser?.id ?? null;

      if (data.mode === "create") {
        if (!isAdmin) {
          toast("ສຳລັບຜູ້ຈັດການເທົ່ານັ້ນ", "error");
          return;
        }

        const items = (data.items ?? []).map((item: any) => ({
          ingredientId: item.ingredientId,
          supplierId: item.supplierId,
          quantity: Number(item.qty),
          unitPrice: parseCurrency(item.unitPrice),
        }));
        const invalidItem = items.some(
          (item: any) =>
            !item.ingredientId ||
            !item.supplierId ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isFinite(item.unitPrice) ||
            item.unitPrice < 0,
        );

        if (items.length === 0 || invalidItem) {
          toast("ໃສ່ລາຍການ, ຈຳນວນ, ລາຄາ ແລະ ຜູ້ສະໜອງ", "error");
          return;
        }

        await apiClient.supplyOrders.createList({ staffId, items });
        const [orders, orderDetails] = await Promise.all([
          apiClient.supplyOrders.getAll(),
          apiClient.supplyOrderDetails.getAll(),
        ]);
        setSupplyOrders(orders);
        setSupplyOrderDetails(orderDetails);
        toast("ຢືນຢັນລາຍການແລ້ວ: waiting for stock", "success");
        setModal(null);
        return;
      }

      const checkedItems = (data.items ?? []).map((item: any) => ({
        detailId: item.detailId,
        ingredientId: item.ingredientId,
        receivedQuantity: Number(item.receivedQuantity),
        actualUnitPrice: parseCurrency(item.actualUnitPrice),
      }));
      const invalidCheckedItem = checkedItems.some(
        (item: any) =>
          !item.detailId ||
          !item.ingredientId ||
          !Number.isFinite(item.receivedQuantity) ||
          item.receivedQuantity < 0 ||
          !Number.isFinite(item.actualUnitPrice) ||
          item.actualUnitPrice < 0,
      );

      if (!data.orderId || checkedItems.length === 0 || invalidCheckedItem) {
        toast("ກວດຈຳນວນ ແລະ ລາຄາກ່ອນ", "error");
        return;
      }

      await apiClient.supplyOrders.receive(Number(data.orderId), {
        staffId,
        items: checkedItems,
      });
      const [nextStock, orders, orderDetails] = await Promise.all([
        apiClient.stock.getAll(),
        apiClient.supplyOrders.getAll(),
        apiClient.supplyOrderDetails.getAll(),
      ]);
      setStock(nextStock);
      setSupplyOrders(orders);
      setSupplyOrderDetails(orderDetails);
      toast("ກວດແລ້ວ ເພີ່ມເຂົ້າຄັງແລ້ວ", "success");
      setModal(null);
    } catch (err) {
      console.error("Receive stock failed", err);
      const apiError = getApiErrorInfo(err);

      if (apiError.status === 401) {
        toast("Login expired. Please log in again.", "error");
        logout();
        return;
      }

      if (apiError.status === 403) {
        toast("Admin only. Log in as admin to confirm.", "error");
        return;
      }

      toast(apiError.message || "ຜິດພາດ", "error");
    }
  };

  const submitSession = async () => {
    if (!modal?.data) return;
    const data = modal.data;
    const note = String(data.note ?? "").trim();
    const sessionType = data.sessionType ?? "dine-in";
    const tableNumber = sessionType === "dine-in" ? data.tableNumber : null;

    if (sessionType === "dine-in" && !tableNumber) {
      toast("ເລືອກໂຕະກ່ອນ", "error");
      return;
    }

    try {
      const created = await apiClient.sessions.create({
        sessionType,
        note,
        tableNumber,
        staffId: currentUser?.id ?? null,
        status: "Active",
      });
      setSessions((p) => [created, ...p]);
      await refreshTables();
      setSelSession(created.id);
      setModal({ type: "qr-display", title: "ບິນ QR", data: created });
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
        tableNumber: session.tableNumber ?? null,
        staffId: session.staffId ?? null,
        status: "PendingPayment",
      });
    } catch (err) {
      console.error("Request payment failed", err);
      toast("ຂໍການຊໍາລະບໍ່ສຳເລັດ", "error");
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
      toast("ລະຫັດບິນບໍ່ຖືກຕ້ອງ", "error");
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
        tableNumber: session.tableNumber ?? null,
        staffId: session.staffId ?? null,
        status: "Completed",
        endedAt: new Date().toISOString(),
      });
      const nextStock = await apiClient.stock.getAll();
      setStock(nextStock);
      setSessions((p) => p.filter((x) => x.id !== id));
      await refreshTables();
      if (selSession === id) setSelSession(null);
      setModal(null);
      paymentLocks.current.delete(id);
      toast(`ຊໍາລະ ${id} ສຳເລັດ`, "success");
    } catch (err) {
      console.error("Payment failed", err);
      const apiError = getApiErrorInfo(err);
      paymentLocks.current.delete(id);
      toast(apiError.message || "ຊໍາລະບໍ່ສໍາເລັດ", "error");
    }
  };

  const cancelSession = (id: string) =>
    setModal({
      type: "confirm",
      title: "ຍົກເລີກບິນ",
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
              tableNumber: session.tableNumber ?? null,
              staffId: session.staffId ?? null,
              status: "Completed",
              endedAt: new Date().toISOString(),
            });
          }
          setSessions((p) => p.filter((s) => s.id !== id));
          await refreshTables();
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
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const includesSearch = (...values: unknown[]) =>
    !normalizedSearch ||
    values.some((value) =>
      String(value ?? "").toLowerCase().includes(normalizedSearch),
    );
  const searchedMenu = menu.filter((item) =>
    includesSearch(item.name, item.en, item.cat, item.price, item.ok ? "open ເປີດ" : "closed ປິດ"),
  );
  const searchedStock = stock.filter((item) =>
    includesSearch(item.name, item.unit, item.cur, item.min),
  );
  const searchedIngredients = ingredients.filter((item) =>
    includesSearch(item.name, item.unit, item.stockQuantity, item.costPerUnit),
  );
  const searchedSessions = sessions.filter((session) =>
    includesSearch(session.id, session.note, session.payMethod, session.sessionType, session.tableNumber, session.status, session.createdAt),
  );
  const searchedSales = sales.filter((sale) =>
    includesSearch(sale.table, sale.items, sale.total, sale.date, sale.time),
  );
  const searchedStaff = staff.filter((member) =>
    includesSearch(member.name, member.role, member.username, member.phone, member.since),
  );
  const closeSearchSuggestions = () => {
    setSearchSuggestionsClosing(true);
    window.setTimeout(() => {
      setShowSearchSuggestions(false);
      setSearchSuggestionsClosing(false);
    }, 160);
  };
  const startSidebarResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const move = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(52, Math.min(180, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
      if (nextWidth <= 54) {
        setSidebarHidden(true);
      }
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  const suggestionSource = [
    ...menu.map((item) => ({
      id: `menu-${item.id}`,
      title: item.name,
      page: "ເມນູ",
      detail: `${item.cat} · ${kip(item.price)} · ${item.ok ? "ເປີດ" : "ປິດ"}`,
      view: "menu",
      terms: [item.name, item.en, item.cat, item.price, item.ok ? "open ເປີດ" : "closed ປິດ"],
    })),
    ...stock.map((item) => ({
      id: `stock-${item.id}`,
      title: item.name,
      page: "ຄັງ",
      detail: `${item.cur} ${item.unit} · ຕ່ຳສຸດ ${item.min}`,
      view: "stock",
      terms: [item.name, item.unit, item.cur, item.min],
    })),
    ...ingredients.map((item) => ({
      id: `ingredient-${item.id}`,
      title: item.name,
      page: "ຄັງ",
      detail: `${item.stockQuantity} ${item.unit} · ຕົ້ນທຶນ ${item.costPerUnit}`,
      view: "stock",
      terms: [item.name, item.unit, item.stockQuantity, item.costPerUnit],
    })),
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      title: session.id,
      page: "ບິນ",
      detail: `${session.note || "ບິນ"} · ${session.status}`,
      view: "billing",
      terms: [session.id, session.note, session.status, session.payMethod, session.tableNumber],
    })),
    ...sales.map((sale) => ({
      id: `sale-${sale.id}`,
      title: sale.table,
      page: "ລາຍງານ",
      detail: `${kip(sale.total)} · ${sale.date} ${sale.time}`,
      view: "reports",
      terms: [sale.table, sale.items, sale.total, sale.date, sale.time],
    })),
    ...staff.map((member) => ({
      id: `staff-${member.id}`,
      title: member.name,
      page: "ພະນັກງານ",
      detail: `${roleLabel(member.role)} · ${member.username ?? member.since}`,
      view: "staff",
      terms: [member.name, member.role, member.username, member.phone, member.since],
    })),
    ...categories.map((category) => {
      const name = category.category_name ?? category.categoryName ?? category.name;
      const id = category.category_id ?? category.categoryId ?? category.id ?? name;
      return {
        id: `category-${id}`,
        title: name,
        page: "ເມນູ",
        detail: "ໝວດເມນູ",
        view: "menu",
        terms: [name],
      };
    }),
  ];
  const searchSuggestions = normalizedSearch
    ? suggestionSource
        .map((item) => {
          const haystack = item.terms.map((term) => String(term ?? "").toLowerCase());
          const starts = haystack.some((term) => term.startsWith(normalizedSearch));
          const contains = haystack.some((term) => term.includes(normalizedSearch));
          return { ...item, score: starts ? 0 : contains ? 1 : 2 };
        })
        .filter((item) => item.score < 2)
        .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
        .slice(0, 20)
    : [];
  const lowStockItems = stock.filter((item) => item.cur <= item.min);
  const lowIngredientItems = ingredients.filter((item) => item.stockQuantity <= item.minThreshold);
  const latestErrorToast = [...toasts].reverse().find((toastItem) => toastItem.type === "error");
  const generatedNotificationItems = [
    ...sessions
      .filter((session) => session.status === "pending_payment")
      .map((session) => ({
        id: `pending-${session.id}`,
        title: "ລໍຖ້າຊໍາລະ",
        detail: `${session.id} · ${session.note || "ບິນລູກຄ້າ"}`,
        view: "billing",
      })),
    ...lowIngredientItems.map((ingredient) => ({
      id: `ingredient-${ingredient.id}`,
      title: "ວັດຖຸດິບໃກ້ໝົດ",
      detail: `${ingredient.name}: ${ingredient.stockQuantity} ${ingredient.unit}`,
      view: "stock",
    })),
    ...lowStockItems.map((item) => ({
      id: `stock-${item.id}`,
      title: "ສິນຄ້າໃກ້ໝົດ",
      detail: `${item.name}: ${item.cur} ${item.unit}`,
      view: "stock",
    })),
    ...(sessions.length > 0
      ? [{
          id: "active-bills",
          title: "ບິນທີ່ເປີດ",
          detail: `${sessions.length} ເປີດ · ${pendingBillsCount} ລໍຖ້າຊໍາລະ`,
          view: "pos",
        }]
      : []),
  ].slice(0, 8);
  const notificationItems = generatedNotificationItems.filter(
    (item) => !clearedNotificationIds.includes(item.id),
  );

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "ຫຼັກ" },
    { id: "pos", icon: ShoppingCart, label: "ຂາຍ" },
    { id: "menu", icon: Utensils, label: "ເມນູ" },
    { id: "stock", icon: Package, label: "ຄັງ" },
    { id: "billing", icon: QrCode, label: "ບິນ" },
    { id: "sales-history", icon: ShoppingCart, label: "ການຂາຍ" },
    { id: "reports", icon: BarChart2, label: "ລາຍງານ" },
    { id: "staff", icon: Users, label: "ພະນັກ" },
  ];

  const titles: Record<string, string> = {
    dashboard: "ພາບລວມ",
    pos: "ຈັດການໂຕະ",
    menu: "ເມນູ",
    stock: "ຄັງ",
    billing: "ບິນ",
    "sales-history": "ປະຫວັດການຂາຍ",
    reports: "ລາຍງານ",
    staff: "ພະນັກ",
  };

  const billId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("bill")
      : null;
  const isCustomerPage =
    typeof window !== "undefined" && window.location.pathname === "/customer";
  const customerSession = billId
    ? sessions.find((session) => session.id === billId)
    : null;

  if (billId || isCustomerPage) {
    return (
      <CustomerPage
        billId={billId ?? "ເມນູ"}
        loaded={loaded}
        session={customerSession ?? null}
        menu={menu}
        categories={categories}
        addItem={addItem}
        rmItem={rmItem}
        requestPayment={requestPayment}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="login-page">
        <form className="login-panel" onSubmit={submitLogin}>
          <div className="login-logo">
            <ChefHat size={24} color={C.gold} />
          </div>
          <div className="login-kicker">ໂອເລ້ເຂົ້າຊອຍ</div>
          <div className="login-title">ເຂົ້າລະບົບພະນັກງານ</div>
          <label className="login-field">
            <span>ຊື່ຜູ້ໃຊ້</span>
            <input
              autoFocus
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((current) => ({
                  ...current,
                  username: e.target.value,
                }))
              }
            />
          </label>
          <label className="login-field">
            <span>ລະຫັດຜ່ານ</span>
            <input
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
            />
          </label>
          {loginError && <div className="login-error">{loginError}</div>}
          <button className="login-submit" type="submit" disabled={loginLoading}>
            {loginLoading ? "ກໍາລັງເຂົ້າລະບົບ..." : "ເຂົ້າລະບົບ"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {sidebarHidden ? (
        <button
          type="button"
          className="app-sidebar-pop"
          onClick={() => {
            setSidebarHidden(false);
            setSidebarWidth(Math.max(sidebarWidth, 66));
          }}
          aria-label="ສະແດງແຖບຂ້າງ"
        >
          <ChefHat size={18} />
        </button>
      ) : (
        <div
          className={`app-sidebar ${sidebarWidth >= 112 ? "app-sidebar--expanded" : ""}`}
          style={{ width: sidebarWidth }}
        >
          <div className="app-logo">
            <ChefHat size={20} color={C.gold} />
          </div>
          {navItems.map((n) => (
            <NavBtn
              key={n.id}
              icon={n.icon}
              label={n.label}
              active={view === n.id}
              expanded={sidebarWidth >= 112}
              onClick={() => {
                setView(n.id);
                setSearchTerm("");
                setShowSearchSuggestions(false);
                setSearchSuggestionsClosing(false);
                setShowNotifications(false);
                setSelSession(null);
                setShowAddItems(false);
              }}
            />
          ))}
          <div className="app-sidebar-spacer" />
          <div className={`app-sync ${loaded ? "app-sync--saved" : "app-sync--loading"}`}>
            {loaded ? "● ບັນທຶກແລ້ວ" : "● ..."}
          </div>
          <NavBtn
            icon={Settings}
            label="ຕັ້ງຄ່າ"
            active={false}
            expanded={sidebarWidth >= 112}
            onClick={() => {}}
          />
          <NavBtn icon={LogOut} label="ອອກ" active={false} expanded={sidebarWidth >= 112} onClick={logout} />
          <button
            type="button"
            className="app-sidebar-resize"
            onPointerDown={startSidebarResize}
            aria-label="ປັບຂະໜາດແຖບຂ້າງ"
          />
        </div>
      )}

      <div className="app-main">
        <div className="app-header">
          <div className="app-header-titleblock">
            <div className="app-kicker">
              ໂອເລ້ເຂົ້າຊອຍ ຫຼວງພະບາງ
            </div>
            <div className="app-title">
              {titles[view]}
            </div>
          </div>
          <div className="app-header-searchslot">
            <div className="app-search">
            <Search size={13} color={C.textDim} />
            <input
              className="app-search-input"
              value={searchTerm}
              onFocus={() => {
                setSearchSuggestionsClosing(false);
                setShowSearchSuggestions(true);
              }}
              onBlur={closeSearchSuggestions}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchSuggestionsClosing(false);
                setShowSearchSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && normalizedSearch) {
                  closeSearchSuggestions();
                }
              }}
              placeholder="ຄົ້ນຫາ..."
            />
            {showSearchSuggestions && normalizedSearch && (
              <div className={`app-search-suggestions ${searchSuggestionsClosing ? "app-search-suggestions--closing" : ""}`}>
                {searchSuggestions.length === 0 ? (
                  <div className="app-search-suggestion-empty">ບໍ່ພົບຜົນລັບ</div>
                ) : (
                  searchSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="app-search-suggestion"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setView(item.view);
                        setSearchTerm(item.title);
                        setShowSearchSuggestions(false);
                        setSearchSuggestionsClosing(false);
                        setSelSession(null);
                        setShowAddItems(false);
                      }}
                    >
                      <span>{item.title}</span>
                      <small>
                        <strong>{item.page}</strong>
                        <em>{item.detail}</em>
                      </small>
                    </button>
                  ))
                )}
              </div>
            )}
            </div>
          </div>
          <div className="app-header-actions">
            <div className="app-notification">
              <button
                type="button"
                className="app-notification-button"
                onClick={() => setShowNotifications((current) => !current)}
                aria-label="ການແຈ້ງເຕືອນ"
              >
                <Bell size={17} color={C.textMid} />
                {notificationItems.length > 0 && (
                  <div className="app-notification-dot" />
                )}
              </button>
              {showNotifications && (
                <div className="app-notification-panel">
                  <div className="app-notification-header">
                    <span>ການແຈ້ງເຕືອນ</span>
                    <button
                      type="button"
                      onClick={() => {
                        setClearedNotificationIds((current) =>
                          Array.from(new Set([...current, ...notificationItems.map((item) => item.id)])),
                        );
                      }}
                    >
                      ລ້າງ
                    </button>
                  </div>
                  <div className="app-notification-list">
                    {notificationItems.length === 0 ? (
                      <div className="app-notification-empty">ບໍ່ມີການແຈ້ງເຕືອນ</div>
                    ) : (
                      notificationItems.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className="app-notification-item"
                          onClick={() => {
                            setView(item.view);
                            setSearchTerm("");
                            setShowNotifications(false);
                          }}
                        >
                          <span>{item.title}</span>
                          <small>{item.detail}</small>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="app-user">
              <div className="app-user-name">{currentUser.name}</div>
              <div className="app-user-role">{roleLabel(currentUser.role)}</div>
            </div>
            <div className="app-avatar">
              {currentUser.name?.slice(0, 1).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        <div className={`app-content ${view === "pos" ? "app-content--pos" : ""}`}>
          {view === "dashboard" && (
            <Dashboard sales={searchedSales} sessions={searchedSessions} menu={searchedMenu} />
          )}
          {view === "pos" && (
            <POS
              tables={tables}
              sessions={searchedSessions}
              menu={menu}
              addMenu={searchedMenu}
              selectedSessionId={selSession}
              setSelectedSessionId={setSelSession}
              showAddItems={showAddItems}
              setShowAddItems={setShowAddItems}
              createBill={createBill}
              createTable={createTable}
              deleteTable={deleteTable}
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
              sessions={searchedSessions}
              menu={menu}
              setModal={setModal}
              requestPayment={requestPayment}
              confirmPayment={confirmPayment}
              cancelSession={cancelSession}
            />
          )}
          {view === "sales-history" && (
            <SalesHistoryView sales={searchedSales} />
          )}
          {view === "menu" && (
            <MenuView
              menu={searchedMenu}
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
              stock={searchedStock}
              suppliers={suppliers}
              supplyOrders={supplyOrders}
              supplyOrderDetails={supplyOrderDetails}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              setModal={setModal}
              deleteStock={deleteStock}
            />
          )}
          {view === "reports" && (
            <ReportsView
              sales={searchedSales}
              menu={searchedMenu}
              recipes={recipes}
              ingredients={searchedIngredients}
              staff={searchedStaff}
              sessions={searchedSessions}
              revenueTotal={revenueTotal}
              activeBillsCount={activeBillsCount}
              pendingBillsCount={pendingBillsCount}
            />
          )}
          {view === "staff" && (
            <StaffView
              staff={searchedStaff}
              isAdmin={isAdmin}
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
          addMenuOptionGroup={addMenuOptionGroup}
          setMenuOptionGroupField={setMenuOptionGroupField}
          removeMenuOptionGroup={removeMenuOptionGroup}
          addMenuOptionValue={addMenuOptionValue}
          setMenuOptionValueField={setMenuOptionValueField}
          removeMenuOptionValue={removeMenuOptionValue}
          submitMenu={submitMenu}
        />
      )}

      {modal?.type === "category-form" && (
        <CategoryFormModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          submitCategory={submitCategory}
        />
      )}

      {modal?.type === "category-manager" && (
        <CategoryManagerModal
          modal={modal}
          categories={categories}
          onClose={() => setModal(null)}
          openAddCategory={() =>
            setModal({
              type: "category-form",
              title: "ເພີ່ມໝວດເມນູ",
              data: { name: "" },
            })
          }
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
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
          tables={tables}
          currentUser={currentUser}
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
          suppliers={suppliers}
        />
      )}

      {modal?.type === "stock-receive" && (
        <StockReceiveModal
          modal={modal}
          onClose={() => setModal(null)}
          setField={setField}
          submitReceive={submitReceive}
          suppliers={suppliers}
          stock={stock}
          isAdmin={isAdmin}
        />
      )}

      {modal?.type === "supplier-manager" && (
        <SupplierManagerModal
          modal={modal}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          setField={setField}
          submitSupplier={submitSupplier}
          editSupplier={editSupplier}
          deleteSupplier={deleteSupplier}
        />
      )}

      {modal?.type === "confirm" && (
        <ConfirmModal modal={modal} onClose={() => setModal(null)} />
      )}

      {modal?.type === "qr-display" && (
        <QrDisplayModal modal={modal} onClose={() => setModal(null)} />
      )}

      {latestErrorToast && (
        <div className="error-popup-layer">
          <div className="error-popup-card">
            <div className="error-popup-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="error-popup-title">ຜິດພາດ</div>
            <div className="error-popup-message">{latestErrorToast.msg}</div>
            <button
              type="button"
              className="error-popup-button"
              onClick={() =>
                setToasts((current) =>
                  current.filter((toastItem) => toastItem.id !== latestErrorToast.id),
                )
              }
            >
              ລອງອີກຄັ້ງ
            </button>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.filter((t) => t.type !== "error").map((t) => (
          <div
            key={t.id}
            className="toast-item"
          >
            <CheckCircle size={15} color={C.green} />
            <span className="toast-text">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

