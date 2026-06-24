import { Bell, Check, Home, Minus, Plus, Receipt, Search, ShoppingBag, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { kip, parseCurrency } from "../config/constants";
import type { MenuItem, MenuOptionGroup, MenuOptionValue, SaleItem, SessionItem } from "../types";
import olayLogo from "../assets/logo/olaylogo.png";
import "./CustomerPage.css";

type CustomerPageProps = {
  billId: string;
  loaded: boolean;
  session: SessionItem | null;
  menu: MenuItem[];
  categories: any[];
  sales: SaleItem[];
  submitOrder: (sessionId: string, items: Array<{ id: number; qty: number; note?: string | null }>) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
  confirmOrderReceived: (sessionId: string) => void | Promise<void>;
};

type Tab = "home" | "menu" | "cart" | "offers" | "profile";
type SelectedOptions = Record<string, Array<string | number>>;
type CustomerCartOption = {
  groupName: string;
  valueName: string;
  priceDelta: number;
};
type CustomerCartLine = {
  key: string;
  menuId: number;
  qty: number;
  unitPrice: number;
  options: CustomerCartOption[];
  note?: string;
  serverNote?: string;
};

const parseOptionTokens = (optionPart: string) =>
  optionPart
    .split(/\s*(?:;|,\s)\s*/)
    .map(part => part.trim())
    .filter(Boolean);
const optionTokenMatches = (token: string, groupName: string, valueName: string) => {
  const prefix = `${groupName}: ${valueName}`;

  return token === prefix || token.startsWith(`${prefix} +`);
};

const cartLineSignature = (lines: CustomerCartLine[]) =>
  lines
    .map((line) => `${line.menuId}:${line.qty}:${String(line.serverNote ?? line.note ?? "").trim()}`)
    .sort()
    .join("|");

export default function CustomerPage({
  billId,
  loaded,
  session,
  menu,
  categories,
  sales,
  submitOrder,
  requestPayment,
  confirmOrderReceived,
}: CustomerPageProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ທັງໝົດ");
  const [showNotice, setShowNotice] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [editingCartLineKey, setEditingCartLineKey] = useState<string | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [detailNote, setDetailNote] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderNoticeOpen, setOrderNoticeOpen] = useState(false);
  const [orderNoticeTitle, setOrderNoticeTitle] = useState("ຄົວໄດ້ຮັບອໍເດີແລ້ວ");
  const [orderNoticeDetail, setOrderNoticeDetail] = useState("ກຳລັງຈັດກຽມອາຫານໃຫ້ທ່ານ");
  const [cartDraftDirty, setCartDraftDirty] = useState(false);
  const [cartLines, setCartLines] = useState<CustomerCartLine[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem(`customer-cart-options:${billId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const waitingPayment = session?.status === "pending_payment";
  const orderSubmitted = Boolean(session?.orderStatus || waitingPayment);
  const orderReceived = session?.orderStatus === "ready" || waitingPayment;
  const canOrder = Boolean(session && !waitingPayment && !orderReceived);

  const availableMenu = menu.filter((item) => item.ok !== false);
  const categoryNames = useMemo(
    () => {
      const fromDatabase = categories
        .map((item) => item.category_name ?? item.categoryName ?? item.name)
        .filter(Boolean);
      const fromMenu = availableMenu.map((item) => item.cat).filter(Boolean);
      return ["ທັງໝົດ", ...Array.from(new Set([...fromDatabase, ...fromMenu]))];
    },
    [availableMenu, categories],
  );
  const categoryCards = categoryNames
    .filter((item) => item !== "ທັງໝົດ")
    .slice(0, 6)
    .map((name) => ({
      name,
      item: availableMenu.find((entry) => entry.cat === name),
    }));
  const visibleMenu = availableMenu
    .filter((item) => category === "ທັງໝົດ" || item.cat === category)
    .filter((item) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [item.name, item.en, item.cat].some((value) =>
        String(value ?? "").toLowerCase().includes(term),
      );
    });
  const featuredItems = visibleMenu.slice(0, 4);
  const soldQuantityByMenu = useMemo(() => {
    const quantities = new Map<number, number>();
    sales.forEach((sale) => {
      (sale.orders ?? []).forEach((order) => {
        quantities.set(order.id, (quantities.get(order.id) ?? 0) + order.qty);
      });
    });
    return quantities;
  }, [sales]);
  const recommendedItems = useMemo(
    () =>
      [...availableMenu]
        .sort((a, b) => {
          const quantityDifference =
            (soldQuantityByMenu.get(b.id) ?? b.sold ?? 0) -
            (soldQuantityByMenu.get(a.id) ?? a.sold ?? 0);
          return quantityDifference || a.name.localeCompare(b.name);
        })
        .slice(0, 2),
    [availableMenu, soldQuantityByMenu],
  );
  const popularItems = [...visibleMenu]
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 8);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`customer-cart-options:${billId}`, JSON.stringify(cartLines));
  }, [billId, cartLines]);

  const optionKey = (group: MenuOptionGroup) => String(group.id ?? group.name);
  const optionValueKey = (value: MenuOptionValue) => value.id ?? value.name;
  const optionPriceDelta = (value: MenuOptionValue) => parseCurrency(value.priceDelta || 0);
  const buildDefaultOptions = (item: MenuItem): SelectedOptions => {
    const nextOptions: SelectedOptions = {};

    (item.optionGroups ?? []).forEach((group) => {
      if (group.selectionType === "single" && group.values?.[0]) {
        nextOptions[optionKey(group)] = [optionValueKey(group.values[0])];
      }
    });

    return nextOptions;
  };
  const parseSessionNote = (item: MenuItem, note: string) => {
    const noteParts = String(note ?? "")
      .split("|")
      .map(part => part.trim())
      .filter(Boolean);
    const optionPart = noteParts[0] ?? "";
    const optionTokens = parseOptionTokens(optionPart);
    let hasMatchedOption = false;
    const options = (item.optionGroups ?? []).flatMap((group) =>
      (group.values ?? [])
        .filter((value) => {
          const match = optionTokens.some(token => optionTokenMatches(token, group.name, value.name));
          if (match) hasMatchedOption = true;
          return match;
        })
        .map((value) => ({
          groupName: group.name,
          valueName: value.name,
          priceDelta: optionPriceDelta(value),
        })),
    );
    const freeNote = hasMatchedOption ? noteParts.slice(1).join(" | ") : noteParts.join(" | ");

    return { options, note: freeNote };
  };

  const sessionMissing = loaded && Boolean(billId) && !session;

  useEffect(() => {
    if (!sessionMissing || typeof window === "undefined") return;
    window.localStorage.removeItem(`customer-cart-options:${billId}`);
  }, [billId, sessionMissing]);

  const sessionCartRows = session?.items ?? [];
  const sessionCartLines: CustomerCartLine[] = sessionCartRows
    .map((item) => {
      const menuItem = menu.find((entry) => entry.id === item.id);
      const cleanNote = String(item.note ?? "").trim();

      if (!menuItem || item.qty <= 0) return null;

      const parsed = parseSessionNote(menuItem, cleanNote);
      const optionSignature = parsed.options
        .map((option) => `${option.groupName}:${option.valueName}:${option.priceDelta}`)
        .sort()
        .join("|");
      const unitPrice = menuItem.price + parsed.options.reduce((sum, option) => sum + option.priceDelta, 0);

      return {
        key: `${item.id}:${optionSignature || "base"}:${parsed.note.toLowerCase() || "no-note"}`,
        menuId: item.id,
        qty: item.qty,
        unitPrice,
        options: parsed.options,
        note: parsed.note,
        serverNote: cleanNote,
      };
    })
    .filter(Boolean) as CustomerCartLine[];
  const hasPendingOrderUpdate =
    orderSubmitted &&
    cartDraftDirty &&
    cartLineSignature(cartLines) !== cartLineSignature(sessionCartLines);
  const displayCartLines = orderSubmitted && !cartDraftDirty ? sessionCartLines : cartLines;
  const cartItems: Array<CustomerCartLine & { menuItem: MenuItem }> = displayCartLines
    .map((item) => ({
      ...item,
      menuItem: menu.find((entry) => entry.id === item.menuId),
    }))
    .filter((item): item is CustomerCartLine & { menuItem: MenuItem } => Boolean(item.menuItem));
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  if (sessionMissing) {
    return (
      <div className="customer-mobile-page">
        <div className="customer-mobile-shell">
          <header className="customer-mobile-top customer-mobile-top--ended">
            <div className="customer-mobile-brand-row">
              <div className="customer-mobile-branch">{billId}</div>
              <div className="customer-mobile-logo">
                <img src={olayLogo} alt="Olay Food" />
              </div>
            </div>
          </header>

          <main className="customer-session-ended">
            <div className="customer-session-ended-card">
              <div className="customer-session-ended-icon">
                <Receipt size={28} />
              </div>
              <h1>Session not found</h1>
              <p>Please scan QR to start ordering.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const openMenuDetail = (item: MenuItem) => {
    setEditingCartLineKey(null);
    setSelectedOptions(buildDefaultOptions(item));
    setDetailNote("");
    setDetailQty(1);
    setSelectedMenu(item);
  };

  const openCartLineDetail = (line: CustomerCartLine & { menuItem?: MenuItem }) => {
    if (!line.menuItem) return;

    const nextOptions = buildDefaultOptions(line.menuItem);

    (line.menuItem.optionGroups ?? []).forEach((group) => {
      const values = (group.values ?? [])
        .filter((value) =>
          line.options.some((option) =>
            option.groupName === group.name &&
            option.valueName === value.name &&
            option.priceDelta === optionPriceDelta(value),
          ),
        )
        .map(optionValueKey);

      if (values.length > 0) {
        nextOptions[optionKey(group)] = values;
      }
    });

    setEditingCartLineKey(line.key);
    setSelectedOptions(nextOptions);
    setDetailNote(line.note ?? "");
    setDetailQty(line.qty);
    setSelectedMenu(line.menuItem);
  };

  const closeMenuDetail = () => {
    setSelectedMenu(null);
    setEditingCartLineKey(null);
    setDetailQty(1);
    setSelectedOptions({});
    setDetailNote("");
  };

  const isOptionSelected = (group: MenuOptionGroup, value: MenuOptionValue) =>
    (selectedOptions[optionKey(group)] ?? []).includes(optionValueKey(value));
  const toggleOption = (group: MenuOptionGroup, value: MenuOptionValue) => {
    const groupKey = optionKey(group);
    const valueKey = optionValueKey(value);

    setSelectedOptions((current) => {
      const currentValues = current[groupKey] ?? [];

      if (group.selectionType === "multiple") {
        return {
          ...current,
          [groupKey]: currentValues.includes(valueKey)
            ? currentValues.filter((item) => item !== valueKey)
            : [...currentValues, valueKey],
        };
      }

      return { ...current, [groupKey]: [valueKey] };
    });
  };

  const selectedOptionValues = selectedMenu
    ? (selectedMenu.optionGroups ?? []).flatMap((group) =>
        (group.values ?? [])
          .filter((value) => isOptionSelected(group, value))
          .map((value) => ({
            groupName: group.name,
            valueName: value.name,
            priceDelta: optionPriceDelta(value),
          })),
      )
    : [];
  const optionTotal = selectedOptionValues.reduce(
    (sum, value) => sum + value.priceDelta,
    0,
  );
  const detailUnitPrice = (selectedMenu?.price ?? 0) + optionTotal;
  const detailTotal = detailUnitPrice * detailQty;

  const addSelectedMenu = () => {
    if (session && selectedMenu) {
      const optionSignature = selectedOptionValues
        .map((option) => `${option.groupName}:${option.valueName}:${option.priceDelta}`)
        .sort()
        .join("|");
      const cleanNote = detailNote.trim();
      const optionNote = selectedOptionValues
        .map((option) => `${option.groupName}: ${option.valueName}${option.priceDelta > 0 ? ` + ${kip(option.priceDelta)}` : ""}`)
        .join(" ; ");
      const serverNote = [optionNote, cleanNote].filter(Boolean).join(" | ");
      const lineKey = `${selectedMenu.id}:${optionSignature || "base"}:${cleanNote.toLowerCase() || "no-note"}`;
      const nextLine: CustomerCartLine = {
        key: lineKey,
        menuId: selectedMenu.id,
        qty: detailQty,
        unitPrice: detailUnitPrice,
        options: selectedOptionValues,
        note: cleanNote,
        serverNote,
      };

      setCartLines((current) => {
        const source = orderSubmitted && !cartDraftDirty ? sessionCartLines : current;

        if (editingCartLineKey) {
          const withoutEditing = source.filter((line) => line.key !== editingCartLineKey);
          const existing = withoutEditing.find((line) => line.key === lineKey);

          if (existing) {
            return withoutEditing.map((line) =>
              line.key === lineKey
                ? { ...line, qty: line.qty + detailQty, unitPrice: detailUnitPrice, options: selectedOptionValues, note: cleanNote, serverNote }
                : line,
            );
          }

          return [...withoutEditing, nextLine];
        }

        const existing = source.find((line) => line.key === lineKey);

        if (existing) {
          return source.map((line) =>
            line.key === lineKey
              ? { ...line, qty: line.qty + detailQty, unitPrice: detailUnitPrice, options: selectedOptionValues, note: cleanNote, serverNote }
              : line,
          );
        }

        return [...source, nextLine];
      });
      if (orderSubmitted) setCartDraftDirty(true);

      closeMenuDetail();
      setTab("cart");
    }
  };

  const increaseCartLine = (line: CustomerCartLine) => {
    if (!session) return;
    setCartLines((current) =>
      line.key.startsWith("base-")
        ? current
        : (orderSubmitted && !cartDraftDirty ? sessionCartLines : current).map((item) => item.key === line.key ? { ...item, qty: item.qty + 1 } : item),
    );
    if (orderSubmitted) {
      setCartDraftDirty(true);
    }
  };

  const decreaseCartLine = (line: CustomerCartLine) => {
    if (!session) return;
    setCartLines((current) =>
      line.key.startsWith("base-")
        ? current
        : (orderSubmitted && !cartDraftDirty ? sessionCartLines : current)
            .map((item) => item.key === line.key ? { ...item, qty: item.qty - 1 } : item)
            .filter((item) => item.qty > 0),
    );
    if (orderSubmitted) {
      setCartDraftDirty(true);
    }
  };

  const submitCartOrder = async () => {
    if (!session || cartItems.length === 0 || submittingOrder) return;

    setSubmittingOrder(true);
    const isUpdate = orderSubmitted;
    try {
      await submitOrder(
        session.id,
        cartItems.map((item) => ({
          id: item.menuId,
          qty: item.qty,
          note: item.serverNote ?? item.note ?? "",
        })),
      );
      setCartDraftDirty(false);
      setOrderNoticeTitle(isUpdate ? "ອັບເດດອໍເດີແລ້ວ" : "ຄົວໄດ້ຮັບອໍເດີແລ້ວ");
      setOrderNoticeDetail(isUpdate ? "ຄົວໄດ້ຮັບລາຍການເພີ່ມແລ້ວ" : "ກຳລັງຈັດກຽມອາຫານໃຫ້ທ່ານ");
      setOrderNoticeOpen(true);
      window.setTimeout(() => setOrderNoticeOpen(false), 1800);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const renderMenuImage = (item?: MenuItem) => (
    item?.image ? <img src={item.image} alt={item.name} /> : <Utensils size={24} />
  );

  return (
    <div className="customer-mobile-page">
      <div className="customer-mobile-shell">
        <header className={tab === "cart" ? "customer-mobile-top customer-mobile-top--cart" : "customer-mobile-top"}>
          <div className="customer-mobile-brand-row">
            <div className="customer-mobile-branch">{session?.note || billId}</div>
            <div className="customer-mobile-logo">
              <img src={olayLogo} alt="Olay Food" />
            </div>
            <button
              type="button"
              className="customer-mobile-bell"
              onClick={() => setShowNotice((current) => !current)}
              aria-label="ແຈ້ງເຕືອນ"
            >
              <Bell size={14} />
              {waitingPayment && <span />}
            </button>
          </div>
          <div className="customer-mobile-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ຄົ້ນຫາ"
            />
          </div>
          {showNotice && (
            <div className="customer-mobile-notice">
              <strong>{waitingPayment ? "ຂໍຊໍາລະແລ້ວ" : "ບິນກໍາລັງເປີດ"}</strong>
              <small>
                {waitingPayment
                  ? "ກະລຸນາລໍພະນັກງານຢືນຢັນ."
                  : `ມີ ${cartCount} ລາຍການໃນກະຕ່າ.`}
              </small>
            </div>
          )}
        </header>

        <main className="customer-mobile-content">
          {!loaded ? (
            <div className="customer-mobile-message">ກໍາລັງໂຫຼດເມນູ...</div>
          ) : tab === "cart" ? (
            <section className="customer-mobile-cart">
              {cartItems.length === 0 ? (
                <div className="customer-mobile-message">ຍັງບໍ່ມີລາຍການ.</div>
              ) : (
                <div className="customer-mobile-cart-list">
                  {cartItems.map((item) => (
                    <div
                      key={item.key}
                      className="customer-mobile-cart-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openCartLineDetail(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openCartLineDetail(item);
                        }
                      }}
                    >
                      <div className="customer-mobile-cart-thumb">
                        {renderMenuImage(item.menuItem)}
                      </div>
                      <div>
                        <strong>{item.menuItem?.name}</strong>
                        {item.options.length > 0 && (
                          <div className="customer-mobile-cart-options">
                            {item.options.map((option) => (
                              <span key={`${item.key}-${option.groupName}-${option.valueName}`}>
                                {option.groupName}: {option.valueName}
                                {option.priceDelta > 0 ? ` + ${kip(option.priceDelta)}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.note && <small className="customer-mobile-cart-note">ໝາຍເຫດ: {item.note}</small>}
                        <small>{kip(item.unitPrice)}</small>
                      </div>
                      <div className="customer-mobile-qty">
                        <button
                          disabled={!canOrder}
                          onClick={(event) => {
                            event.stopPropagation();
                            decreaseCartLine(item);
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{item.qty}</span>
                        <button
                          disabled={!canOrder}
                          onClick={(event) => {
                            event.stopPropagation();
                            increaseCartLine(item);
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="customer-mobile-cart-spacer" />

              <div className="customer-mobile-cart-footer">
                <div className="customer-mobile-cart-head">
                  <div>
                    <span>ກະຕ່າຂອງທ່ານ</span>
                    <strong>{cartCount} ລາຍການ</strong>
                  </div>
                  <div>{kip(total)}</div>
                </div>

                {waitingPayment ? (
                  <div className="customer-mobile-waiting">ກໍາລັງລໍພະນັກງານຢືນຢັນ</div>
                ) : !session ? (
                  <div className="customer-mobile-waiting">ສະແກນ QR ຂອງໂຕະເພື່ອເລີ່ມສັ່ງອາຫານ.</div>
                ) : orderReceived ? (
                  <button
                    type="button"
                    className="customer-mobile-pay"
                    disabled={cartItems.length === 0 || submittingOrder}
                    onClick={() => requestPayment(session.id)}
                  >
                    <Receipt size={18} />
                    ຂໍຊໍາລະ
                  </button>
              ) : orderSubmitted ? (
                <div className="customer-order-actions">
                  <button type="button" onClick={() => {
                    setCartLines(sessionCartLines);
                    setCartDraftDirty(false);
                    setTab("menu");
                  }}>
                    ສັ່ງເພີ່ມ
                  </button>
                  <button
                    type="button"
                    onClick={() => hasPendingOrderUpdate ? submitCartOrder() : confirmOrderReceived(session.id)}
                  >
                    {hasPendingOrderUpdate ? "ອັບເດດອໍເດີ" : "ໄດ້ຮັບແລ້ວ"}
                  </button>
                </div>
                ) : (
                  <button
                    type="button"
                    className="customer-mobile-pay"
                    disabled={cartItems.length === 0 || submittingOrder}
                    onClick={submitCartOrder}
                  >
                    <Receipt size={18} />
                    ສັ່ງອາຫານ
                  </button>
                )}
              </div>
            </section>
          ) : tab === "offers" ? (
            <section className="customer-mobile-simple">
              <h2>ໂປຣໂມຊັນ</h2>
              <div className="customer-mobile-promo customer-mobile-promo--soft">
                <div>
                  <strong>ພິເສດມື້ນີ້</strong>
                  <span>ເພີ່ມເມນູທີ່ມັກຈາກແຖບເມນູ.</span>
                </div>
              </div>
            </section>
          ) : tab === "profile" ? (
            <section className="customer-mobile-simple">
              <h2>ໂປຣໄຟລ໌</h2>
              <div className="customer-mobile-message">
                {session ? `${billId} · ${session.note || "ບິນລູກຄ້າ"}` : "ໜ້າຕົວຢ່າງເມນູລູກຄ້າ"}
              </div>
            </section>
          ) : (
            <>
              {tab === "home" && (
                <>
                  <section className="customer-mobile-promos">
                    <h2>ເມນູຂາຍດີທີ່ຢາກແນະນຳ</h2>
                    {recommendedItems.map((item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`customer-mobile-promo ${index === 1 ? "customer-mobile-promo--gold" : ""}`}
                        onClick={() => openMenuDetail(item)}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.cat} · {kip(item.price)}</span>
                          <em>ສັ່ງຕອນນີ້</em>
                        </div>
                        <div className="customer-mobile-promo-image">{renderMenuImage(item)}</div>
                      </button>
                    ))}
                  </section>

                  <section className="customer-mobile-section">
                    <div className="customer-mobile-section-head">
                      <h2>ໝວດໝູ່</h2>
                      <button type="button" onClick={() => setTab("menu")}>ເບິ່ງທັງໝົດ</button>
                    </div>
                    <div className="customer-mobile-category-cards">
                      {categoryCards.map((card) => (
                        <button
                          key={card.name}
                          type="button"
                          onClick={() => {
                            setCategory(card.name);
                            setTab("menu");
                          }}
                        >
                          <div>{renderMenuImage(card.item)}</div>
                          <span>{card.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="customer-mobile-section">
                    <div className="customer-mobile-section-head">
                      <h2>ລາຍການເມນູ</h2>
                    </div>
                    {featuredItems.length === 0 ? (
                      <div className="customer-mobile-message">
                        {menu.length === 0 ? "ຍັງບໍ່ມີເມນູຈາກຖານຂໍ້ມູນ." : "ບໍ່ມີເມນູໃນໝວດນີ້."}
                      </div>
                    ) : (
                      <div className="customer-mobile-featured-grid">
                        {featuredItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="customer-mobile-feature-card"
                            onClick={() => openMenuDetail(item)}
                          >
                            <div className="customer-mobile-feature-image">{renderMenuImage(item)}</div>
                            <div>
                              <strong>{item.name}</strong>
                              <small>{item.cat}</small>
                              <span>{kip(item.price)}</span>
                            </div>
                            <em aria-label="ເພີ່ມເມນູ">
                              <Plus size={14} />
                            </em>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {tab === "menu" && (
                <>
                  <div className="customer-mobile-categories">
                    {categoryNames.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={category === item ? "is-active" : ""}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <section className="customer-mobile-section">
                    <div className="customer-mobile-section-head">
                      <h2>ເມນູຍອດນິຍົມ</h2>
                    </div>
                    <div className="customer-mobile-popular-list">
                      {popularItems.length === 0 ? (
                        <div className="customer-mobile-message">
                          {menu.length === 0 ? "ຍັງບໍ່ມີເມນູຈາກຖານຂໍ້ມູນ." : "ບໍ່ມີເມນູໃນໝວດນີ້."}
                        </div>
                      ) : popularItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="customer-mobile-popular-row"
                          onClick={() => openMenuDetail(item)}
                        >
                          <div className="customer-mobile-popular-image">{renderMenuImage(item)}</div>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.cat}</small>
                            <span>{kip(item.price)}</span>
                          </div>
                          <em aria-label="ເພີ່ມເມນູ">
                            <Plus size={14} />
                          </em>
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>

        {selectedMenu && (
          <div className="customer-detail-overlay" role="dialog" aria-modal="true" aria-label={selectedMenu.name}>
            <button
              type="button"
              className="customer-detail-scrim"
              onClick={closeMenuDetail}
              aria-label="ປິດລາຍລະອຽດເມນູ"
            />
            <main className="customer-detail">
              <button
                type="button"
                className="customer-detail-close"
                onClick={closeMenuDetail}
                aria-label="ປິດລາຍລະອຽດເມນູ"
              >
                <X size={22} />
              </button>

              <div className="customer-detail-image">
                {renderMenuImage(selectedMenu)}
              </div>

              <section className="customer-detail-body">
                <div className="customer-detail-meta">
                  <span>{selectedMenu.cat}</span>
                  <strong>{kip(selectedMenu.price)}</strong>
                </div>
                <h1>{selectedMenu.name}</h1>
                {selectedMenu.en && selectedMenu.en !== selectedMenu.name && (
                  <p>{selectedMenu.en}</p>
                )}

                {(selectedMenu.optionGroups ?? []).length > 0 && (
                  <div className="customer-detail-options">
                    {(selectedMenu.optionGroups ?? []).map((group) => (
                      <div key={optionKey(group)} className="customer-detail-option-group">
                        <div className="customer-detail-option-head">
                          <span>{group.name}</span>
                          <small>
                            {group.selectionType === "multiple" ? "ເລືອກໄດ້ຫຼາຍ" : "ເລືອກໜຶ່ງຢ່າງ"}
                            {group.required ? " · ຈໍາເປັນ" : ""}
                          </small>
                        </div>
                        <div className="customer-detail-option-values">
                          {(group.values ?? []).map((value) => {
                            const selected = isOptionSelected(group, value);

                            return (
                              <button
                                key={String(optionValueKey(value))}
                                type="button"
                                className={selected ? "is-selected" : ""}
                                onClick={() => toggleOption(group, value)}
                              >
                                <span>{value.name}</span>
                                {optionPriceDelta(value) > 0 && (
                                  <small>+ {kip(optionPriceDelta(value))}</small>
                                )}
                                {selected && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className="customer-detail-note">
                  <span>ໝາຍເຫດ</span>
                  <textarea
                    value={detailNote}
                    onChange={(event) => setDetailNote(event.target.value)}
                    placeholder="ຕົວຢ່າງ: ແພ້ຖົ່ວ, ບໍ່ໃສ່ຫອມ, ເຜັດນ້ອຍ"
                    maxLength={255}
                  />
                </label>

              </section>

              <div className="customer-detail-bar">
                <div className="customer-detail-stepper">
                  <button type="button" disabled={detailQty <= 1} onClick={() => setDetailQty((qty) => Math.max(1, qty - 1))}>
                    <Minus size={18} />
                  </button>
                  <span>{detailQty}</span>
                  <button type="button" onClick={() => setDetailQty((qty) => qty + 1)}>
                    <Plus size={18} />
                  </button>
                </div>
                <span className="customer-detail-bar-divider" />
                <button type="button" className="customer-detail-add-cart" disabled={!canOrder} onClick={addSelectedMenu}>
                  {editingCartLineKey ? "ອັບເດດກະຕ່າ" : "ເພີ່ມໃສ່ກະຕ່າ"} <span>|</span> {kip(detailTotal)}
                </button>
              </div>
            </main>
          </div>
        )}

        <nav className="customer-mobile-nav">
          <button type="button" className={tab === "home" ? "is-active" : ""} onClick={() => setTab("home")}>
            <Home size={22} />
            <span>ຫຼັກ</span>
          </button>
          <button type="button" className={tab === "menu" ? "is-active" : ""} onClick={() => setTab("menu")}>
            <Receipt size={22} />
            <span>ເມນູ</span>
          </button>
          <button type="button" className={tab === "cart" ? "customer-mobile-cart-action is-active" : "customer-mobile-cart-action"} onClick={() => setTab("cart")}>
            <ShoppingBag size={22} />
            <span>ກະຕ່າ</span>
            {cartCount > 0 && (
              <em className="customer-mobile-cart-badge" aria-label={`${cartCount} ລາຍການໃນກະຕ່າ`}>
                {cartCount > 99 ? "99+" : cartCount}
              </em>
            )}
          </button>
        </nav>

        {orderNoticeOpen && (
          <div className="customer-order-popup" role="status" aria-live="polite">
            <div>
              <Check size={28} />
              <strong>{orderNoticeTitle}</strong>
              <span>{orderNoticeDetail}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
