import { Bell, CreditCard, Home, Minus, Percent, Plus, Receipt, Search, ShoppingBag, UserCircle, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { kip } from "../config/constants";
import type { MenuItem, SessionItem } from "../types";
import "./CustomerPage.css";

type CustomerPageProps = {
  billId: string;
  loaded: boolean;
  session: SessionItem | null;
  menu: MenuItem[];
  categories: any[];
  addItem: (sessionId: string, menuId: number) => void | Promise<void>;
  rmItem: (sessionId: string, menuId: number) => void | Promise<void>;
  requestPayment: (sessionId: string) => void | Promise<void>;
};

type Tab = "home" | "menu" | "cart" | "offers" | "profile";

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
  const [category, setCategory] = useState("All");
  const [showNotice, setShowNotice] = useState(false);
  const waitingPayment = session?.status === "pending_payment";
  const canOrder = Boolean(session && !waitingPayment);

  const availableMenu = menu.filter((item) => item.ok !== false);
  const categoryNames = useMemo(
    () => {
      const fromDatabase = categories
        .map((item) => item.category_name ?? item.categoryName ?? item.name)
        .filter(Boolean);
      const fromMenu = availableMenu.map((item) => item.cat).filter(Boolean);
      return ["All", ...Array.from(new Set([...fromDatabase, ...fromMenu]))];
    },
    [availableMenu, categories],
  );
  const categoryCards = categoryNames
    .filter((item) => item !== "All")
    .slice(0, 6)
    .map((name) => ({
      name,
      item: availableMenu.find((entry) => entry.cat === name),
    }));
  const visibleMenu = availableMenu
    .filter((item) => category === "All" || item.cat === category)
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
  const cartItems = session?.items
    .map((item) => ({
      ...item,
      menuItem: menu.find((entry) => entry.id === item.id),
    }))
    .filter((item) => item.menuItem) ?? [];
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const total = cartItems.reduce((sum, item) => sum + (item.menuItem?.price ?? 0) * item.qty, 0);

  const addMenuItem = (menuId: number) => {
    if (session) void addItem(session.id, menuId);
  };

  const renderMenuImage = (item?: MenuItem) => (
    item?.image ? <img src={item.image} alt={item.name} /> : <Utensils size={24} />
  );

  return (
    <div className="customer-mobile-page">
      <div className="customer-mobile-shell">
        <header className="customer-mobile-top">
          <div className="customer-mobile-brand-row">
            <div className="customer-mobile-logo">
              <Utensils size={20} />
              <span>OLAYFOOD</span>
            </div>
            <div className="customer-mobile-branch">{session?.note || billId}</div>
            <button
              type="button"
              className="customer-mobile-bell"
              onClick={() => setShowNotice((current) => !current)}
              aria-label="Notifications"
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
              placeholder="Search"
            />
          </div>
          {showNotice && (
            <div className="customer-mobile-notice">
              <strong>{waitingPayment ? "Payment requested" : "Bill active"}</strong>
              <small>
                {waitingPayment
                  ? "Please wait for staff confirmation."
                  : `${cartCount} item${cartCount === 1 ? "" : "s"} in your cart.`}
              </small>
            </div>
          )}
        </header>

        <main className="customer-mobile-content">
          {!loaded ? (
            <div className="customer-mobile-message">Loading menu...</div>
          ) : tab === "cart" ? (
            <section className="customer-mobile-cart">
              <div className="customer-mobile-cart-head">
                <div>
                  <span>Your cart</span>
                  <strong>{cartCount} item{cartCount === 1 ? "" : "s"}</strong>
                </div>
                <div>{kip(total)}</div>
              </div>

              {cartItems.length === 0 ? (
                <div className="customer-mobile-message">No items yet.</div>
              ) : (
                <div className="customer-mobile-cart-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className="customer-mobile-cart-row">
                      <div className="customer-mobile-cart-thumb">
                        {renderMenuImage(item.menuItem)}
                      </div>
                      <div>
                        <strong>{item.menuItem?.name}</strong>
                        <small>{kip(item.menuItem?.price ?? 0)}</small>
                      </div>
                      <div className="customer-mobile-qty">
                        <button disabled={!canOrder} onClick={() => session && void rmItem(session.id, item.id)}>
                          <Minus size={13} />
                        </button>
                        <span>{item.qty}</span>
                        <button disabled={!canOrder} onClick={() => session && void addItem(session.id, item.id)}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {waitingPayment ? (
                <div className="customer-mobile-waiting">Waiting for staff confirmation</div>
              ) : !session ? (
                <div className="customer-mobile-waiting">Scan a table QR code to start ordering.</div>
              ) : (
                <button
                  type="button"
                  className="customer-mobile-pay"
                  disabled={cartItems.length === 0}
                  onClick={() => requestPayment(session.id)}
                >
                  <CreditCard size={16} />
                  Request payment
                </button>
              )}
            </section>
          ) : tab === "offers" ? (
            <section className="customer-mobile-simple">
              <h2>Offers</h2>
              <div className="customer-mobile-promo customer-mobile-promo--soft">
                <div>
                  <strong>Today special</strong>
                  <span>Add your favorite menu items from the menu tab.</span>
                </div>
              </div>
            </section>
          ) : tab === "profile" ? (
            <section className="customer-mobile-simple">
              <h2>Profile</h2>
              <div className="customer-mobile-message">
                {session ? `${billId} · ${session.note || "Customer bill"}` : "Customer menu preview"}
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
                    disabled={!canOrder}
                    onClick={() => addMenuItem(item.id)}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.cat} · {kip(item.price)}</span>
                      <em>Order Now</em>
                    </div>
                    <div className="customer-mobile-promo-image">{renderMenuImage(item)}</div>
                  </button>
                ))}
              </section>

              {tab === "home" && (
                <>
                  <section className="customer-mobile-section">
                    <div className="customer-mobile-section-head">
                      <h2>Categories</h2>
                      <button type="button" onClick={() => setTab("menu")}>View All</button>
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
                      <h2>Featured Items</h2>
                    </div>
                    {featuredItems.length === 0 ? (
                      <div className="customer-mobile-message">
                        {menu.length === 0 ? "No menu rows loaded from database." : "No menu items in this category."}
                      </div>
                    ) : (
                      <div className="customer-mobile-featured-grid">
                        {featuredItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="customer-mobile-feature-card"
                            disabled={!canOrder}
                            onClick={() => addMenuItem(item.id)}
                          >
                            <div className="customer-mobile-feature-image">{renderMenuImage(item)}</div>
                            <div>
                              <strong>{item.name}</strong>
                              <small>{item.cat}</small>
                              <span>{kip(item.price)}</span>
                            </div>
                            <em>Add</em>
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
                      <h2>Most Popular Items</h2>
                    </div>
                    <div className="customer-mobile-popular-list">
                      {popularItems.length === 0 ? (
                        <div className="customer-mobile-message">
                          {menu.length === 0 ? "No menu rows loaded from database." : "No menu items in this category."}
                        </div>
                      ) : popularItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="customer-mobile-popular-row"
                          disabled={!canOrder}
                          onClick={() => addMenuItem(item.id)}
                        >
                          <div className="customer-mobile-popular-image">{renderMenuImage(item)}</div>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.cat}</small>
                            <span>{kip(item.price)}</span>
                          </div>
                          <em>Add</em>
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
            <span>Home</span>
          </button>
          <button type="button" className={tab === "menu" ? "is-active" : ""} onClick={() => setTab("menu")}>
            <Receipt size={19} />
            <span>Menu</span>
          </button>
          <button type="button" className="customer-mobile-cart-action" onClick={() => setTab("cart")}>
            <ShoppingBag size={22} />
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
          <button type="button" className={tab === "offers" ? "is-active" : ""} onClick={() => setTab("offers")}>
            <Percent size={19} />
            <span>Offers</span>
          </button>
          <button type="button" className={tab === "profile" ? "is-active" : ""} onClick={() => setTab("profile")}>
            <UserCircle size={19} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
