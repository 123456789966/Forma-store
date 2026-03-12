import { useState, useEffect, useCallback } from "react";
import { authAPI, productAPI, cartAPI, orderAPI, adminAPI } from "./api";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const G = {
  bg: "#FAFAF7", surface: "#FFFFFF", border: "#E8E6E0",
  text: "#1A1917", muted: "#7C7A75", accent: "#C17B3F",
  accentDark: "#9E6030", success: "#3A7D44", error: "#C0392B", tag: "#F0EDE6",
};

const css = {
  app: { fontFamily: "'Georgia','Times New Roman',serif", background: G.bg, minHeight: "100vh", color: G.text },
  nav: { background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" },
  navBrand: { fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.04em", color: G.text, cursor: "pointer", background: "none", border: "none" },
  navBtn: (active) => ({ background: active ? G.accent : "transparent", color: active ? "#fff" : G.text, border: `1px solid ${active ? G.accent : G.border}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", transition: "all 0.15s" }),
  main: { maxWidth: 1240, margin: "0 auto", padding: "32px 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 24 },
  card: { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden", transition: "box-shadow 0.2s", cursor: "pointer" },
  cardImg: { height: 160, background: G.tag, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 },
  cardBody: { padding: "18px 20px 20px" },
  tag: { background: G.tag, color: G.muted, fontSize: 11, padding: "3px 8px", borderRadius: 4, fontFamily: "sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" },
  btn: (variant = "primary", size = "md") => {
    const sizes = { sm: { padding: "7px 14px", fontSize: 13 }, md: { padding: "10px 20px", fontSize: 15 }, lg: { padding: "13px 28px", fontSize: 16 } };
    const variants = { primary: { background: G.accent, color: "#fff", border: `1px solid ${G.accent}` }, outline: { background: "transparent", color: G.accent, border: `1px solid ${G.accent}` }, ghost: { background: "transparent", color: G.muted, border: `1px solid ${G.border}` }, danger: { background: G.error, color: "#fff", border: `1px solid ${G.error}` } };
    return { ...sizes[size], ...variants[variant], borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6 };
  },
  input: { width: "100%", padding: "10px 14px", border: `1px solid ${G.border}`, borderRadius: 7, fontSize: 15, fontFamily: "inherit", background: G.surface, color: G.text, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 13, fontWeight: 600, color: G.muted, marginBottom: 4, display: "block", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" },
  flex: (gap = 12, align = "center") => ({ display: "flex", alignItems: align, gap }),
  between: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 32, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  h3: { fontSize: 17, fontWeight: 700, marginBottom: 8 },
  divider: { border: "none", borderTop: `1px solid ${G.border}`, margin: "24px 0" },
};

const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: G.text, color: "#fff", padding: "12px 20px", borderRadius: 9, fontSize: 14, fontFamily: "sans-serif", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "#7CFC7C" }}>✓</span> {msg}
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: 60, color: G.muted, fontFamily: "sans-serif" }}>Loading…</div>;
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: G.surface, borderRadius: 14, padding: 36, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: G.muted }}>×</button>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const fn = mode === "login" ? authAPI.login : authAPI.register;
      const res = await fn(form);
      const { user, token } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 48, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>🛍️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>Forma Store</h1>
          <p style={{ color: G.muted, marginTop: 4, fontFamily: "sans-serif", fontSize: 14 }}>Thoughtfully curated goods</p>
        </div>
        <div style={{ display: "flex", background: G.tag, borderRadius: 8, padding: 4, marginBottom: 28 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 0", background: mode === m ? G.surface : "transparent", border: mode === m ? `1px solid ${G.border}` : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: mode === m ? 600 : 400, color: mode === m ? G.text : G.muted, transition: "all 0.15s" }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <form onSubmit={handle}>
          {mode === "register" && (
            <div style={{ marginBottom: 16 }}>
              <label style={css.label}>Name</label>
              <input style={css.input} placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={css.label}>Email</label>
            <input style={css.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={css.label}>Password</label>
            <input style={css.input} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          {err && <p style={{ color: G.error, fontSize: 13, marginBottom: 16, fontFamily: "sans-serif" }}>{err}</p>}
          <button type="submit" disabled={loading} style={{ ...css.btn("primary", "lg"), width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <hr style={css.divider} />
        <div style={{ background: G.tag, borderRadius: 8, padding: "12px 16px", fontFamily: "sans-serif", fontSize: 13, color: G.muted }}>
          <strong>Demo credentials:</strong><br />
          Admin: admin@formastore.com / admin123<br />
          User: jane@example.com / password123
        </div>
      </div>
    </div>
  );
}

// ─── SHOP PAGE ────────────────────────────────────────────────────────────────
function ShopPage({ onToast, cartCount, setCartCount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [addingId, setAddingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (search) params.search = search;
      if (cat !== "All") params.category = cat;
      if (minP) params.minPrice = minP;
      if (maxP) params.maxPrice = maxP;
      const res = await productAPI.getAll(params);
      setProducts(res.data.data.products);
    } catch { } finally { setLoading(false); }
  }, [search, cat, sort, minP, maxP]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    productAPI.getCategories().then(r => setCategories(["All", ...r.data.data.categories])).catch(() => {});
  }, []);

  const addToCart = async (product, q = 1) => {
    setAddingId(product._id);
    try {
      await cartAPI.add(product._id, q);
      setCartCount(c => c + q);
      onToast(`${product.name} added to cart`);
      setSelected(null);
    } catch (e) {
      onToast(e.response?.data?.message || "Could not add to cart");
    } finally { setAddingId(null); }
  };

  return (
    <div style={css.main}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#3D2B1F 0%,#6B4226 60%,#C17B3F 100%)", borderRadius: 16, padding: "48px 40px", marginBottom: 40, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)", fontSize: 120, opacity: 0.15 }}>🛍️</div>
        <p style={{ fontFamily: "sans-serif", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginBottom: 10 }}>Spring Collection 2025</p>
        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 12, lineHeight: 1.1 }}>Objects Worth<br />Keeping</h1>
        <p style={{ opacity: 0.8, fontSize: 16, maxWidth: 400, fontFamily: "sans-serif" }}>Curated everyday goods — designed to last, built with care.</p>
      </div>

      {/* Filters */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label style={css.label}>Search</label>
            <input style={css.input} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={css.label}>Price Range</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...css.input, width: 80 }} placeholder="$Min" type="number" value={minP} onChange={e => setMinP(e.target.value)} />
              <span style={{ color: G.muted }}>–</span>
              <input style={{ ...css.input, width: 80 }} placeholder="$Max" type="number" value={maxP} onChange={e => setMaxP(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={css.label}>Sort</label>
            <select style={{ ...css.input, width: "auto", cursor: "pointer" }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low→High</option>
              <option value="price_desc">Price: High→Low</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${cat === c ? G.accent : G.border}`, background: cat === c ? G.accent : "transparent", color: cat === c ? "#fff" : G.muted, cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", transition: "all 0.15s" }}>{c}</button>
          ))}
        </div>
      </div>

      <p style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13, marginBottom: 20 }}>{products.length} products</p>

      {loading ? <Spinner /> : (
        <div style={css.grid}>
          {products.map(p => (
            <div key={p._id} style={css.card} onClick={() => { setSelected(p); setQty(1); }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={css.cardImg}>{p.emoji || "📦"}</div>
              <div style={css.cardBody}>
                <div style={{ ...css.between, marginBottom: 10 }}>
                  <span style={css.tag}>{p.category}</span>
                  <span style={{ color: p.stock < 10 ? G.error : G.success, fontSize: 12, fontFamily: "sans-serif" }}>{p.stock < 10 ? `${p.stock} left` : "In stock"}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                <p style={{ color: G.muted, fontSize: 13, fontFamily: "sans-serif", marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>
                <div style={css.between}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>${p.price}</span>
                    <div style={{ fontSize: 12, color: "#C8993A", marginTop: 2 }}>{stars(p.rating)} <span style={{ color: G.muted, fontFamily: "sans-serif" }}>({p.numReviews})</span></div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); addToCart(p); }} disabled={addingId === p._id} style={{ ...css.btn("primary", "sm"), opacity: addingId === p._id ? 0.6 : 1 }}>
                    {addingId === p._id ? "…" : "+ Cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div style={{ textAlign: "center", fontSize: 80, marginBottom: 20 }}>{selected.emoji || "📦"}</div>
          <span style={css.tag}>{selected.category}</span>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "10px 0 6px" }}>{selected.name}</h2>
          <p style={{ color: G.muted, fontFamily: "sans-serif", marginBottom: 16, lineHeight: 1.6 }}>{selected.description}</p>
          <div style={{ ...css.flex(6), marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>${selected.price}</span>
            <span style={{ color: "#C8993A" }}>{stars(selected.rating)}</span>
            <span style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13 }}>({selected.numReviews} reviews)</span>
          </div>
          <p style={{ color: selected.stock < 10 ? G.error : G.success, fontFamily: "sans-serif", fontSize: 13, marginBottom: 24 }}>
            {selected.stock < 10 ? `⚠ Only ${selected.stock} remaining` : "✓ In stock"}
          </p>
          <div style={{ ...css.flex(12), marginBottom: 24 }}>
            <label style={{ ...css.label, margin: 0 }}>Qty:</label>
            <div style={css.flex(4)}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ ...css.btn("ghost", "sm"), padding: "6px 12px" }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 600, minWidth: 28, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(selected.stock, q + 1))} style={{ ...css.btn("ghost", "sm"), padding: "6px 12px" }}>+</button>
            </div>
          </div>
          <button onClick={() => addToCart(selected, qty)} disabled={addingId === selected._id} style={{ ...css.btn("primary", "lg"), width: "100%", justifyContent: "center", opacity: addingId === selected._id ? 0.6 : 1 }}>
            {addingId === selected._id ? "Adding…" : `Add to Cart — $${(selected.price * qty).toFixed(2)}`}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ setCartCount, onCheckout }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const fetchCart = async () => {
    try { const r = await cartAPI.get(); setCart(r.data.data.cart); } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const update = async (productId, qty) => {
    try { const r = await cartAPI.update(productId, qty); setCart(r.data.data.cart); setCartCount(r.data.data.cart.itemCount || 0); } catch { }
  };

  const remove = async (productId) => {
    try { const r = await cartAPI.remove(productId); setCart(r.data.data.cart); setCartCount(r.data.data.cart.itemCount || 0); } catch { }
  };

  const applyCoupon = async () => {
    try {
      const r = await cartAPI.applyCoupon(coupon);
      setCouponMsg(`✓ ${r.data.message}`);
      fetchCart();
    } catch (e) { setCouponMsg(e.response?.data?.message || "Invalid coupon"); }
  };

  if (loading) return <Spinner />;
  if (!cart || !cart.items?.length) return (
    <div style={{ ...css.main, textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 72 }}>🛒</div>
      <h2 style={{ marginTop: 16 }}>Your cart is empty</h2>
      <p style={{ color: G.muted, fontFamily: "sans-serif" }}>Add some items from the shop.</p>
    </div>
  );

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = cart.discount || 0;
  const total = subtotal - discount;

  return (
    <div style={css.main}>
      <h1 style={css.h1}>Your Cart</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
        <div>
          {cart.items.map(item => (
            <div key={item.product?._id} style={{ ...css.flex(16, "flex-start"), background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 48, background: G.tag, borderRadius: 8, width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.product?.emoji || "📦"}</div>
              <div style={{ flex: 1 }}>
                <div style={css.between}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{item.product?.name}</h3>
                  <button onClick={() => remove(item.product?._id)} style={{ background: "none", border: "none", color: G.muted, cursor: "pointer", fontSize: 18 }}>×</button>
                </div>
                <p style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13, margin: "4px 0 12px" }}>${item.price} each</p>
                <div style={css.between}>
                  <div style={css.flex(8)}>
                    <button onClick={() => update(item.product?._id, item.qty - 1)} disabled={item.qty <= 1} style={{ ...css.btn("ghost", "sm"), padding: "4px 10px" }}>−</button>
                    <span style={{ fontWeight: 600, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => update(item.product?._id, item.qty + 1)} style={{ ...css.btn("ghost", "sm"), padding: "4px 10px" }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 28, position: "sticky", top: 80 }}>
          <h2 style={css.h2}>Order Summary</h2>

          {/* Coupon */}
          <div style={{ marginBottom: 20 }}>
            <label style={css.label}>Coupon Code</label>
            <div style={css.flex(8)}>
              <input style={{ ...css.input, flex: 1 }} placeholder="e.g. FORMA10" value={coupon} onChange={e => setCoupon(e.target.value)} />
              <button onClick={applyCoupon} style={css.btn("outline", "sm")}>Apply</button>
            </div>
            {couponMsg && <p style={{ fontSize: 12, marginTop: 6, fontFamily: "sans-serif", color: couponMsg.startsWith("✓") ? G.success : G.error }}>{couponMsg}</p>}
          </div>

          <hr style={css.divider} />
          <div style={{ ...css.between, marginBottom: 8, fontFamily: "sans-serif", fontSize: 14 }}><span style={{ color: G.muted }}>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div style={{ ...css.between, marginBottom: 8, fontFamily: "sans-serif", fontSize: 14 }}><span style={{ color: G.success }}>Discount</span><span style={{ color: G.success }}>-${discount.toFixed(2)}</span></div>}
          <div style={{ ...css.between, marginBottom: 8, fontFamily: "sans-serif", fontSize: 14 }}><span style={{ color: G.muted }}>Shipping</span><span style={{ color: G.success }}>{subtotal >= 50 ? "Free" : "$5.99"}</span></div>
          <hr style={css.divider} />
          <div style={{ ...css.between, marginBottom: 24, fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${(total + (subtotal >= 50 ? 0 : 5.99)).toFixed(2)}</span></div>
          <button onClick={() => onCheckout(cart)} style={{ ...css.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Checkout →</button>
          <p style={{ textAlign: "center", color: G.muted, fontSize: 12, fontFamily: "sans-serif", marginTop: 12 }}>🔒 Secure checkout via Stripe</p>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage({ user, cart, onSuccess }) {
  const [step, setStep] = useState(1);
  const [addr, setAddr] = useState({ name: user.name, street: "", city: "", state: "", zip: "", country: "US" });
  const [card, setCard] = useState({ num: "", exp: "", cvc: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const total = cart?.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;

  const placeOrder = async () => {
    setLoading(true); setErr("");
    try {
      // 1. Create order
      const orderRes = await orderAPI.create({ shippingAddress: addr, paymentMethod: "stripe" });
      const order = orderRes.data.data.order;
      // 2. In production: use Stripe.js + createPaymentIntent here
      // For demo: mark as success directly
      onSuccess(order);
    } catch (e) {
      setErr(e.response?.data?.message || "Order failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={css.main}>
      <h1 style={css.h1}>Checkout</h1>
      <div style={{ display: "flex", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
        {["Shipping", "Payment", "Review"].map((s, i) => (
          <div key={s} style={{ flex: 1, padding: "14px 0", textAlign: "center", background: step === i + 1 ? G.accent : step > i + 1 ? "#E8F5E9" : "transparent", color: step === i + 1 ? "#fff" : step > i + 1 ? G.success : G.muted, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, borderRight: i < 2 ? `1px solid ${G.border}` : "none" }}>
            {step > i + 1 ? "✓ " : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
        <div>
          {step === 1 && (
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 32 }}>
              <h2 style={css.h2}>Shipping Address</h2>
              {[["name","Name"],["street","Street"],["city","City"],["state","State"],["zip","ZIP Code"]].map(([f, label]) => (
                <div key={f} style={{ marginBottom: 16 }}>
                  <label style={css.label}>{label}</label>
                  <input style={css.input} value={addr[f]} onChange={e => setAddr({ ...addr, [f]: e.target.value })} />
                </div>
              ))}
              <button onClick={() => setStep(2)} disabled={!addr.street || !addr.city || !addr.zip} style={{ ...css.btn("primary", "lg"), opacity: (!addr.street || !addr.city || !addr.zip) ? 0.5 : 1 }}>Continue →</button>
            </div>
          )}
          {step === 2 && (
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 32 }}>
              <h2 style={css.h2}>Payment Details</h2>
              <div style={{ background: "#F0F7FF", border: "1px solid #BDDEFF", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontFamily: "sans-serif", fontSize: 13, color: "#2255AA" }}>
                🔒 Powered by Stripe. Use test card: <strong>4242 4242 4242 4242</strong>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={css.label}>Card Number</label>
                <input style={css.input} placeholder="4242 4242 4242 4242" maxLength={19} value={card.num} onChange={e => setCard({ ...card, num: e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim() })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div><label style={css.label}>Expiry</label><input style={css.input} placeholder="MM/YY" value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} /></div>
                <div><label style={css.label}>CVC</label><input style={css.input} placeholder="123" maxLength={4} value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g,"") })} /></div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={css.label}>Name on Card</label>
                <input style={css.input} placeholder="John Smith" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} />
              </div>
              <div style={css.flex(12)}>
                <button onClick={() => setStep(1)} style={css.btn("ghost","md")}>← Back</button>
                <button onClick={() => setStep(3)} disabled={!card.num || !card.exp || !card.cvc} style={{ ...css.btn("primary","md"), opacity: (!card.num||!card.exp||!card.cvc)?0.5:1 }}>Review Order →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 32 }}>
              <h2 style={css.h2}>Review & Place Order</h2>
              <div style={{ marginBottom: 20 }}>
                <h3 style={css.h3}>Ships to</h3>
                <p style={{ fontFamily: "sans-serif", color: G.muted, lineHeight: 1.7, fontSize: 14 }}>{addr.name}<br />{addr.street}, {addr.city} {addr.zip}</p>
              </div>
              {err && <p style={{ color: G.error, fontFamily: "sans-serif", fontSize: 13, marginBottom: 16 }}>{err}</p>}
              <div style={css.flex(12)}>
                <button onClick={() => setStep(2)} style={css.btn("ghost","md")}>← Back</button>
                <button onClick={placeOrder} disabled={loading} style={{ ...css.btn("primary","lg"), opacity: loading?0.7:1 }}>
                  {loading ? "⏳ Placing order…" : `Place Order — $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24, height: "fit-content" }}>
          <h3 style={css.h3}>Order Summary</h3>
          {cart?.items?.map((i, idx) => (
            <div key={idx} style={{ ...css.flex(10,"flex-start"), marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{i.product?.emoji || "📦"}</span>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>{i.product?.name || i.name}</p><p style={{ fontSize: 12, color: G.muted, fontFamily: "sans-serif" }}>×{i.qty} — ${(i.price * i.qty).toFixed(2)}</p></div>
            </div>
          ))}
          <hr style={css.divider} />
          <div style={{ ...css.between, fontWeight: 700, fontSize: 17 }}><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS PAGE ─────────────────────────────────────────────────────────────
function SuccessPage({ order, onContinue }) {
  return (
    <div style={{ ...css.main, textAlign: "center", paddingTop: 64 }}>
      <div style={{ fontSize: 72 }}>🎉</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 16 }}>Order Confirmed!</h1>
      <p style={{ color: G.muted, fontFamily: "sans-serif", marginTop: 8, fontSize: 16 }}>Thank you! Your order <strong>{order.orderNumber}</strong> is being processed.</p>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 32, maxWidth: 400, margin: "32px auto", textAlign: "left" }}>
        {order.items?.map((i, idx) => <div key={idx} style={{ ...css.between, marginBottom: 10, fontFamily: "sans-serif", fontSize: 14 }}><span>{i.name} × {i.qty}</span><span>${(i.price * i.qty).toFixed(2)}</span></div>)}
        <hr style={css.divider} />
        <div style={{ ...css.between, fontWeight: 700 }}><span>Total</span><span>${order.pricing?.total?.toFixed(2)}</span></div>
      </div>
      <button onClick={onContinue} style={css.btn("primary","lg")}>Continue Shopping →</button>
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const statusColor = { delivered: G.success, shipped: G.accent, processing: "#2255CC", pending: "#888", cancelled: G.error, refunded: G.muted };

  useEffect(() => {
    orderAPI.getAll().then(r => setOrders(r.data.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!orders.length) return <div style={{ ...css.main, textAlign: "center", paddingTop: 80 }}><div style={{ fontSize: 64 }}>📦</div><h2 style={{ marginTop: 16 }}>No orders yet</h2></div>;

  return (
    <div style={css.main}>
      <h1 style={css.h1}>Order History</h1>
      {orders.map(order => (
        <div key={order._id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 28, marginBottom: 20 }}>
          <div style={{ ...css.between, marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{order.orderNumber}</h3>
              <p style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13, marginTop: 2 }}>Ordered {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span style={{ background: (statusColor[order.status] || G.muted) + "22", color: statusColor[order.status] || G.muted, padding: "5px 12px", borderRadius: 20, fontSize: 13, fontFamily: "sans-serif", fontWeight: 600, textTransform: "capitalize" }}>{order.status}</span>
          </div>
          {order.items?.map((i, idx) => <div key={idx} style={{ ...css.between, fontFamily: "sans-serif", fontSize: 14, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${G.border}` }}><span style={{ color: G.muted }}>{i.name} × {i.qty}</span><span>${(i.price * i.qty).toFixed(2)}</span></div>)}
          <div style={{ ...css.between, fontWeight: 700, marginTop: 12 }}><span>Total</span><span>${order.pricing?.total?.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN DASHBOARD PAGE ─────────────────────────────────────────────────────
function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const statusColor = { delivered: G.success, shipped: G.accent, processing: "#2255CC", pending: "#888", cancelled: G.error };

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <div style={css.main}><p style={{ color: G.error }}>Could not load dashboard.</p></div>;

  const { stats, recentOrders, topProducts, ordersByStatus } = data;

  const StatCard = ({ icon, label, value, sub, subColor }) => (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 2px" }}>{value}</div>
      <div style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13 }}>{label}</div>
      {sub && <div style={{ color: subColor || G.success, fontFamily: "sans-serif", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={css.main}>
      <div style={css.between}>
        <h1 style={css.h1}>Admin Dashboard</h1>
        <span style={{ background: G.error + "22", color: G.error, padding: "5px 12px", borderRadius: 20, fontSize: 13, fontFamily: "sans-serif", fontWeight: 600 }}>Admin Only</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: `1px solid ${G.border}`, paddingBottom: 0 }}>
        {["overview","orders","inventory"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${G.accent}` : "2px solid transparent", fontFamily: "inherit", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? G.accent : G.muted, cursor: "pointer", textTransform: "capitalize", marginBottom: -1 }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 20, marginBottom: 40 }}>
            <StatCard icon="💰" label="Total Revenue" value={`$${(stats.totalRevenue || 0).toLocaleString()}`} sub={stats.revenueGrowth ? `↑ ${stats.revenueGrowth}% vs last month` : null} />
            <StatCard icon="📦" label="Total Orders" value={stats.totalOrders || 0} sub={`${stats.pendingOrders || 0} pending`} subColor={G.accent} />
            <StatCard icon="👥" label="Customers" value={stats.totalCustomers || 0} sub={`+${stats.newCustomersThisMonth || 0} this month`} />
            <StatCard icon="🛍️" label="Products" value={stats.totalProducts || 0} sub={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "All stocked"} subColor={stats.lowStockProducts > 0 ? G.error : G.success} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24 }}>
              <h2 style={css.h2}>Recent Orders</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "sans-serif", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${G.border}` }}>
                    {["Order","Customer","Total","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: G.muted, fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.04em" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.slice(0,8).map((o, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}>
                      <td style={{ padding: "10px 10px", fontWeight: 600 }}>{o.orderNumber}</td>
                      <td style={{ padding: "10px 10px", color: G.muted }}>{o.user?.name || "—"}</td>
                      <td style={{ padding: "10px 10px", fontWeight: 700 }}>${o.pricing?.total?.toFixed(2)}</td>
                      <td style={{ padding: "10px 10px" }}><span style={{ background: (statusColor[o.status] || G.muted) + "22", color: statusColor[o.status] || G.muted, padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24 }}>
              <h2 style={css.h2}>Top Products</h2>
              {topProducts?.map((p, i) => (
                <div key={i} style={{ ...css.between, padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                    <p style={{ color: G.muted, fontSize: 12, fontFamily: "sans-serif" }}>{p.totalSold} sold</p>
                  </div>
                  <span style={{ fontWeight: 700 }}>${p.revenue?.toFixed(2)}</span>
                </div>
              ))}
              {!topProducts?.length && <p style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13 }}>No sales data yet.</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === "orders" && <OrdersAdmin />}
      {activeTab === "inventory" && <InventoryAdmin />}
    </div>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const statusColor = { delivered: G.success, shipped: G.accent, processing: "#2255CC", pending: "#888", cancelled: G.error };
  const allStatuses = ["pending","processing","shipped","delivered","cancelled"];

  useEffect(() => { adminAPI.getOrders().then(r => setOrders(r.data.data.orders)).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch {}
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <h2 style={css.h2}>All Orders ({orders.length})</h2>
      {orders.map(o => (
        <div key={o._id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={css.between}>
            <div>
              <span style={{ fontWeight: 700 }}>{o.orderNumber}</span>
              <span style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13, marginLeft: 12 }}>{o.user?.name} · {new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={css.flex(8)}>
              <span style={{ fontWeight: 700 }}>${o.pricing?.total?.toFixed(2)}</span>
              <select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${G.border}`, fontFamily: "sans-serif", fontSize: 13, cursor: "pointer", color: statusColor[o.status] || G.muted, background: G.surface }}>
                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});

  useEffect(() => { adminAPI.getInventory().then(r => setProducts(r.data.data.products)).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const updateStock = async (id, stock) => {
    try {
      await adminAPI.updateStock(id, { stock: Number(stock) });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: Number(stock) } : p));
      setEditing(prev => ({ ...prev, [id]: false }));
    } catch {}
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <h2 style={css.h2}>Inventory ({products.length} products)</h2>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
        {products.map((p, i) => (
          <div key={p._id} style={{ ...css.between, padding: "16px 24px", borderBottom: i < products.length - 1 ? `1px solid ${G.border}` : "none" }}>
            <div style={css.flex(12)}>
              <span style={{ fontSize: 28 }}>{p.emoji}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                <p style={{ color: G.muted, fontSize: 12, fontFamily: "sans-serif" }}>{p.category} · ${p.price}</p>
              </div>
            </div>
            <div style={css.flex(8)}>
              {editing[p._id] ? (
                <>
                  <input type="number" defaultValue={p.stock} id={`stock-${p._id}`} style={{ ...css.input, width: 80 }} />
                  <button onClick={() => updateStock(p._id, document.getElementById(`stock-${p._id}`).value)} style={css.btn("primary","sm")}>Save</button>
                  <button onClick={() => setEditing(e => ({...e,[p._id]:false}))} style={css.btn("ghost","sm")}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ color: p.stock < 10 ? G.error : G.success, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600 }}>{p.stock} in stock</span>
                  <button onClick={() => setEditing(e => ({...e,[p._id]:true}))} style={css.btn("ghost","sm")}>Edit</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } });
  const [page, setPage] = useState("shop");
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutCart, setCheckoutCart] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // Fetch real cart count on login
  useEffect(() => {
    if (user) {
      cartAPI.get().then(r => setCartCount(r.data.data.cart?.itemCount || 0)).catch(() => {});
    }
  }, [user]);

  const onLogin = (u) => { setUser(u); setPage("shop"); };
  const onLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setCartCount(0); setPage("shop"); };
  const onToast = (msg) => setToast(msg);

  if (!user) return <LoginPage onLogin={onLogin} />;

  const navItems = [
    ["shop", "Shop"],
    ["cart", `Cart${cartCount > 0 ? ` (${cartCount})` : ""}`],
    ["orders", "My Orders"],
    ...(user.role === "admin" ? [["admin", "Dashboard"]] : []),
  ];

  return (
    <div style={css.app}>
      <nav style={css.nav}>
        <button style={css.navBrand} onClick={() => setPage("shop")}>🛍️ Forma</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {navItems.map(([p, label]) => (
            <button key={p} onClick={() => setPage(p)} style={css.navBtn(page === p)}>{label}</button>
          ))}
          <span style={{ color: G.muted, fontFamily: "sans-serif", fontSize: 13, marginLeft: 8 }}>Hi, {user.name?.split(" ")[0]}</span>
          <button onClick={onLogout} style={css.navBtn(false)}>Sign Out</button>
        </div>
      </nav>

      {page === "shop" && <ShopPage onToast={onToast} cartCount={cartCount} setCartCount={setCartCount} />}
      {page === "cart" && <CartPage setCartCount={setCartCount} onCheckout={(cart) => { setCheckoutCart(cart); setPage("checkout"); }} />}
      {page === "checkout" && !successOrder && (
        <CheckoutPage user={user} cart={checkoutCart} onSuccess={order => { setSuccessOrder(order); setCartCount(0); setPage("success"); }} />
      )}
      {page === "success" && successOrder && (
        <SuccessPage order={successOrder} onContinue={() => { setSuccessOrder(null); setPage("shop"); }} />
      )}
      {page === "orders" && <OrdersPage />}
      {page === "admin" && user.role === "admin" && <AdminPage />}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
