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
} from "./config/constants";
import { NavBtn } from "./components/SharedUI";
import {
  CategoryFormModal,
  ConfirmModal,
  MenuFormModal,
  QrDisplayModal,
  SessionFormModal,
  StaffFormModal,
  StockFormModal,
  StockReceiveModal,
} from "./components/modals";
import Dashboard from "./views/Dashboard";
import CustomerPage from "./views/CustomerPage";
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
  role === "manager" ? "Admin" : "Staff";

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
      setLoginError("Enter username and password.");
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
      setLoginError("Invalid username or password.");
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
            priceDelta: Number(value.priceDelta || 0),
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
      price: Number(data.price),
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

    const exists = categories.some((category) => {
      const name = String(
        category.category_name ?? category.categoryName ?? category.name ?? "",
      ).trim();
      return name.toLocaleLowerCase() === categoryName.toLocaleLowerCase();
    });

    if (exists) {
      toast("ໝວດນີ້ມີແລ້ວ", "error");
      return;
    }

    try {
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
      toast("Admin only", "error");
      return;
    }

    const username = String(data.username ?? "").trim();
    const password = String(data.password ?? "");

    if (!data.name || !username || (!data.id && !password)) {
      toast("ໃສ່ຊື່, username ແລະ password", "error");
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
      : toast("Admin only", "error");

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
      page: "Menu",
      detail: `${item.cat} · ${kip(item.price)} · ${item.ok ? "ເປີດ" : "ປິດ"}`,
      view: "menu",
      terms: [item.name, item.en, item.cat, item.price, item.ok ? "open ເປີດ" : "closed ປິດ"],
    })),
    ...stock.map((item) => ({
      id: `stock-${item.id}`,
      title: item.name,
      page: "Stock",
      detail: `${item.cur} ${item.unit} · min ${item.min}`,
      view: "stock",
      terms: [item.name, item.unit, item.cur, item.min],
    })),
    ...ingredients.map((item) => ({
      id: `ingredient-${item.id}`,
      title: item.name,
      page: "Stock",
      detail: `${item.stockQuantity} ${item.unit} · cost ${item.costPerUnit}`,
      view: "stock",
      terms: [item.name, item.unit, item.stockQuantity, item.costPerUnit],
    })),
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      title: session.id,
      page: "Billing",
      detail: `${session.note || "Bill"} · ${session.status}`,
      view: "billing",
      terms: [session.id, session.note, session.status, session.payMethod, session.tableNumber],
    })),
    ...sales.map((sale) => ({
      id: `sale-${sale.id}`,
      title: sale.table,
      page: "Reports",
      detail: `${kip(sale.total)} · ${sale.date} ${sale.time}`,
      view: "reports",
      terms: [sale.table, sale.items, sale.total, sale.date, sale.time],
    })),
    ...staff.map((member) => ({
      id: `staff-${member.id}`,
      title: member.name,
      page: "Staff",
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
        page: "Menu",
        detail: "Menu category",
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
        title: "Payment waiting",
        detail: `${session.id} · ${session.note || "Customer bill"}`,
        view: "billing",
      })),
    ...lowIngredientItems.map((ingredient) => ({
      id: `ingredient-${ingredient.id}`,
      title: "Low ingredient stock",
      detail: `${ingredient.name}: ${ingredient.stockQuantity} ${ingredient.unit}`,
      view: "stock",
    })),
    ...lowStockItems.map((item) => ({
      id: `stock-${item.id}`,
      title: "Low stock item",
      detail: `${item.name}: ${item.cur} ${item.unit}`,
      view: "stock",
    })),
    ...(sessions.length > 0
      ? [{
          id: "active-bills",
          title: "Active bills",
          detail: `${sessions.length} open · ${pendingBillsCount} waiting payment`,
          view: "pos",
        }]
      : []),
  ].slice(0, 8);
  const notificationItems = generatedNotificationItems.filter(
    (item) => !clearedNotificationIds.includes(item.id),
  );

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
  const isCustomerPage =
    typeof window !== "undefined" && window.location.pathname === "/customer";
  const customerSession = billId
    ? sessions.find((session) => session.id === billId)
    : null;

  if (billId || isCustomerPage) {
    return (
      <CustomerPage
        billId={billId ?? "Menu"}
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
          <div className="login-kicker">Olay Khao Soi</div>
          <div className="login-title">Staff login</div>
          <label className="login-field">
            <span>Username</span>
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
            <span>Password</span>
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
            {loginLoading ? "Signing in..." : "Sign in"}
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
          aria-label="Show sidebar"
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
            {loaded ? "● saved" : "● ..."}
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
            aria-label="Resize sidebar"
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
                  <div className="app-search-suggestion-empty">No matches</div>
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
                aria-label="Notifications"
              >
                <Bell size={17} color={C.textMid} />
                {notificationItems.length > 0 && (
                  <div className="app-notification-dot" />
                )}
              </button>
              {showNotifications && (
                <div className="app-notification-panel">
                  <div className="app-notification-header">
                    <span>Notifications</span>
                    <button
                      type="button"
                      onClick={() => {
                        setClearedNotificationIds((current) =>
                          Array.from(new Set([...current, ...notificationItems.map((item) => item.id)])),
                        );
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="app-notification-list">
                    {notificationItems.length === 0 ? (
                      <div className="app-notification-empty">No notifications</div>
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
              sessions={searchedSessions}
              menu={menu}
              addMenu={searchedMenu}
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
              sessions={searchedSessions}
              menu={menu}
              setModal={setModal}
              requestPayment={requestPayment}
              confirmPayment={confirmPayment}
              cancelSession={cancelSession}
            />
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

      {latestErrorToast && (
        <div className="error-popup-layer">
          <div className="error-popup-card">
            <div className="error-popup-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="error-popup-title">Error</div>
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
              Try Again
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

