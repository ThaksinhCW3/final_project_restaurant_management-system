import { ArrowLeft, Bell, Check, CreditCard, Home, Minus, Percent, Plus, Receipt, Search, ShoppingBag, UserCircle, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { kip } from "../config/constants";
import type { MenuItem, MenuOptionGroup, MenuOptionValue, SessionItem } from "../types";
import "./CustomerPage.css";

type CustomerPageProps = {
  billId: string;
  loaded: boolean;
  session: SessionItem | null;
  menu: MenuItem[];
  categories: any[];
  addItem: (sessionId: string, menuId: number, quantity?: number) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
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
};

export default function CustomerPage({
  billId,
  loaded,
  session,
  menu,
  categories,
  addItem,
  rmItem,
  requestPayment,
}: CustomerPageProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ທັງໝົດ");
  const [showNotice, setShowNotice] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
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
  const canOrder = Boolean(session && !waitingPayment);

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
  const popularItems = [...visibleMenu]
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 8);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`customer-cart-options:${billId}`, JSON.stringify(cartLines));
  }, [billId, cartLines]);

  const sessionCartRows = session?.items ?? [];
  const optionLineQtyByMenu = cartLines.reduce<Record<number, number>>((qtyByMenu, line) => {
    qtyByMenu[line.menuId] = (qtyByMenu[line.menuId] ?? 0) + line.qty;
    return qtyByMenu;
  }, {});
  const fallbackCartLines: CustomerCartLine[] = sessionCartRows
    .map((item) => {
      const remainingQty = item.qty - (optionLineQtyByMenu[item.id] ?? 0);
      const menuItem = menu.find((entry) => entry.id === item.id);

      if (!menuItem || remainingQty <= 0) return null;

      return {
        key: `base-${item.id}`,
        menuId: item.id,
        qty: remainingQty,
        unitPrice: menuItem.price,
        options: [],
      };
    })
    .filter(Boolean) as CustomerCartLine[];
  const cartItems = [...cartLines, ...fallbackCartLines]
    .map((item) => ({
      ...item,
      menuItem: menu.find((entry) => entry.id === item.menuId),
    }))
    .filter((item) => item.menuItem);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const openMenuDetail = (item: MenuItem) => {
    const nextOptions: SelectedOptions = {};

    (item.optionGroups ?? []).forEach((group) => {
      if (group.selectionType === "single" && group.values?.[0]?.id != null) {
        nextOptions[String(group.id ?? group.name)] = [group.values[0].id];
      }
    });

    setSelectedOptions(nextOptions);
    setDetailQty(1);
    setSelectedMenu(item);
  };

  const closeMenuDetail = () => {
    setSelectedMenu(null);
    setDetailQty(1);
    setSelectedOptions({});
  };

  const optionKey = (group: MenuOptionGroup) => String(group.id ?? group.name);
  const optionValueKey = (value: MenuOptionValue) => value.id ?? value.name;
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
            priceDelta: Number(value.priceDelta || 0),
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
      const lineKey = `${selectedMenu.id}:${optionSignature || "base"}`;

      setCartLines((current) => {
        const existing = current.find((line) => line.key === lineKey);

        if (existing) {
          return current.map((line) =>
            line.key === lineKey
              ? { ...line, qty: line.qty + detailQty, unitPrice: detailUnitPrice, options: selectedOptionValues }
              : line,
          );
        }

        return [
          ...current,
          {
            key: lineKey,
            menuId: selectedMenu.id,
            qty: detailQty,
            unitPrice: detailUnitPrice,
            options: selectedOptionValues,
          },
        ];
      });
      void addItem(session.id, selectedMenu.id, detailQty);
      closeMenuDetail();
      setTab("cart");
    }
  };

  const increaseCartLine = (line: CustomerCartLine) => {
    if (!session) return;
    setCartLines((current) =>
      line.key.startsWith("base-")
        ? current
        : current.map((item) => item.key === line.key ? { ...item, qty: item.qty + 1 } : item),
    );
    void addItem(session.id, line.menuId);
  };

  const decreaseCartLine = (line: CustomerCartLine) => {
    if (!session) return;
    setCartLines((current) =>
      line.key.startsWith("base-")
        ? current
        : current
            .map((item) => item.key === line.key ? { ...item, qty: item.qty - 1 } : item)
            .filter((item) => item.qty > 0),
    );
    void rmItem(session.id, line.menuId);
  };

  const renderMenuImage = (item?: MenuItem) => (
    item?.image ? <img src={item.image} alt={item.name} /> : <Utensils size={24} />
  );

  if (selectedMenu) {
    return (
      <div className="customer-mobile-page">
        <div className="customer-mobile-shell customer-mobile-shell--detail">
          <main className="customer-detail">
            <button
              type="button"
              className="customer-detail-back"
              onClick={closeMenuDetail}
              aria-label="ກັບໄປໜ້າເມນູ"
            >
              <ArrowLeft size={19} />
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
              <p>{selectedMenu.en || selectedMenu.cat}</p>

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
                              <small>{Number(value.priceDelta || 0) > 0 ? `+ ${kip(Number(value.priceDelta))}` : "ຄ່າເລີ່ມຕົ້ນ"}</small>
                              {selected && <Check size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="customer-detail-quantity">
                <div>
                  <span>ຈໍານວນ</span>
                  <strong>{detailQty}</strong>
                </div>
                <div className="customer-detail-stepper">
                  <button type="button" onClick={() => setDetailQty((qty) => Math.max(1, qty - 1))}>
                    <Minus size={15} />
                  </button>
                  <span>{detailQty}</span>
                  <button type="button" onClick={() => setDetailQty((qty) => qty + 1)}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </section>

            <div className="customer-detail-bar">
              <div>
                <span>ລວມ</span>
                <strong>{kip(detailTotal)}</strong>
              </div>
              <button type="button" disabled={!canOrder} onClick={addSelectedMenu}>
                ເພີ່ມໃສ່ກະຕ່າ
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-mobile-page">
      <div className="customer-mobile-shell">
        <header className="customer-mobile-top">
          <div className="customer-mobile-brand-row">
            <div className="customer-mobile-logo">
              <Utensils size={20} />
              <span>ໂອເລຟູດ</span>
            </div>
            <div className="customer-mobile-branch">{session?.note || billId}</div>
            <button
              type="button"
              className="customer-mobile-bell"
              onClick={() => setShowNotice((current) => !current)}
              aria-label="ແຈ້ງເຕືອນ"
            >
              <Bell size={18} />
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
              <div className="customer-mobile-cart-head">
                <div>
                  <span>ກະຕ່າຂອງທ່ານ</span>
                  <strong>{cartCount} ລາຍການ</strong>
                </div>
                <div>{kip(total)}</div>
              </div>

              {cartItems.length === 0 ? (
                <div className="customer-mobile-message">ຍັງບໍ່ມີລາຍການ.</div>
              ) : (
                <div className="customer-mobile-cart-list">
                  {cartItems.map((item) => (
                    <div key={item.key} className="customer-mobile-cart-row">
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
                        <small>{kip(item.unitPrice)}</small>
                      </div>
                      <div className="customer-mobile-qty">
                        <button disabled={!canOrder} onClick={() => decreaseCartLine(item)}>
                          <Minus size={13} />
                        </button>
                        <span>{item.qty}</span>
                        <button disabled={!canOrder} onClick={() => increaseCartLine(item)}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {waitingPayment ? (
                <div className="customer-mobile-waiting">ກໍາລັງລໍພະນັກງານຢືນຢັນ</div>
              ) : !session ? (
                <div className="customer-mobile-waiting">ສະແກນ QR ຂອງໂຕະເພື່ອເລີ່ມສັ່ງອາຫານ.</div>
              ) : (
                <button
                  type="button"
                  className="customer-mobile-pay"
                  disabled={cartItems.length === 0}
                  onClick={() => requestPayment(session.id)}
                >
                  <CreditCard size={16} />
                  ຂໍຊໍາລະ
                </button>
              )}
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
              <section className="customer-mobile-promos">
                {featuredItems.slice(0, 2).map((item, index) => (
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

              {tab === "home" && (
                <>
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
                      <h2>ເມນູແນະນໍາ</h2>
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
                            <em>ເພີ່ມ</em>
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
                          <em>ເພີ່ມ</em>
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>

        <nav className="customer-mobile-nav">
          <button type="button" className={tab === "home" ? "is-active" : ""} onClick={() => setTab("home")}>
            <Home size={19} />
            <span>ຫຼັກ</span>
          </button>
          <button type="button" className={tab === "menu" ? "is-active" : ""} onClick={() => setTab("menu")}>
            <Receipt size={19} />
            <span>ເມນູ</span>
          </button>
          <button type="button" className="customer-mobile-cart-action" onClick={() => setTab("cart")}>
            <ShoppingBag size={22} />
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
          <button type="button" className={tab === "offers" ? "is-active" : ""} onClick={() => setTab("offers")}>
            <Percent size={19} />
            <span>ໂປຣໂມຊັນ</span>
          </button>
          <button type="button" className={tab === "profile" ? "is-active" : ""} onClick={() => setTab("profile")}>
            <UserCircle size={19} />
            <span>ໂປຣໄຟລ໌</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
