const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ─── GET /api/cart ────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name emoji images price stock isActive");

  if (!cart) {
    return res.json({ success: true, data: { cart: { items: [], subtotal: 0, total: 0, itemCount: 0 } } });
  }

  // Filter out inactive / out-of-stock items automatically
  const validItems = cart.items.filter(item => item.product?.isActive);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({ success: true, data: { cart } });
};

// ─── POST /api/cart/add ───────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }
  if (product.stock < qty) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} in stock.` });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(i => i.product.toString() === productId);
  if (existingItem) {
    const newQty = existingItem.qty + qty;
    if (newQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} in stock.` });
    }
    existingItem.qty = newQty;
    existingItem.price = product.price; // refresh price
  } else {
    cart.items.push({ product: productId, qty, price: product.price });
  }

  await cart.save();
  await cart.populate("items.product", "name emoji images price stock");

  res.json({ success: true, message: `${product.name} added to cart.`, data: { cart } });
};

// ─── PUT /api/cart/update ─────────────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
  const { productId, qty } = req.body;

  if (qty < 1) {
    return res.status(400).json({ success: false, message: "Quantity must be at least 1. Use remove to delete." });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  if (qty > product.stock) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} in stock.` });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) return res.status(404).json({ success: false, message: "Item not in cart." });

  item.qty = qty;
  await cart.save();
  await cart.populate("items.product", "name emoji images price stock");

  res.json({ success: true, message: "Cart updated.", data: { cart } });
};

// ─── DELETE /api/cart/remove/:productId ──────────────────────────────────────
exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate("items.product", "name emoji images price stock");

  res.json({ success: true, message: "Item removed.", data: { cart } });
};

// ─── DELETE /api/cart/clear ───────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], discount: 0, couponCode: null });
  res.json({ success: true, message: "Cart cleared." });
};

// ─── POST /api/cart/coupon ────────────────────────────────────────────────────
exports.applyCoupon = async (req, res) => {
  const { code } = req.body;

  // Simple demo coupons — in production, store these in DB
  const COUPONS = {
    FORMA10: { type: "percent", value: 10 },
    SAVE20: { type: "fixed", value: 20 },
    WELCOME: { type: "percent", value: 15 },
  };

  const coupon = COUPONS[code?.toUpperCase()];
  if (!coupon) return res.status(400).json({ success: false, message: "Invalid coupon code." });

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = coupon.type === "percent"
    ? Math.round((subtotal * coupon.value) / 100 * 100) / 100
    : Math.min(coupon.value, subtotal);

  cart.couponCode = code.toUpperCase();
  cart.discount = discount;
  await cart.save();

  res.json({ success: true, message: `Coupon applied! You save $${discount.toFixed(2)}.`, data: { discount, couponCode: cart.couponCode } });
};