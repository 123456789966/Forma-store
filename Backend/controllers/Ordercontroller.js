const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ─── POST /api/orders ─────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = "stripe", notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty." });
  }

  // Validate stock for each item
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      return res.status(400).json({ success: false, message: `Product "${item.product?.name}" is no longer available.` });
    }
    if (item.product.stock < item.qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} left.` });
    }
  }

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = cart.discount || 0;
  const shippingCost = subtotal >= 50 ? 0 : 5.99; // free shipping over $50
  const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100; // 8% tax
  const total = Math.max(0, subtotal - discount + shippingCost + tax);

  // Build order items
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.emoji,
    price: item.price,
    qty: item.qty,
  }));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    notes,
    pricing: { subtotal, shippingCost, tax, discount, total },
    statusHistory: [{ status: "pending", note: "Order placed" }],
  });

  // Decrement stock
  await Promise.all(
    cart.items.map(item =>
      Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.qty } })
    )
  );

  // Clear cart
  cart.items = [];
  cart.discount = 0;
  cart.couponCode = null;
  await cart.save();

  res.status(201).json({ success: true, message: "Order placed successfully.", data: { order } });
};

// ─── GET /api/orders (my orders) ─────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort("-createdAt").skip(skip).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    },
  });
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate("items.product", "name emoji images");
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  res.json({ success: true, data: { order } });
};

// ─── PUT /api/orders/:id/cancel ───────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  if (!["pending", "processing"].includes(order.status)) {
    return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage." });
  }

  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", note: "Cancelled by customer" });
  await order.save();

  // Restore stock
  await Promise.all(
    order.items.map(item =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } })
    )
  );

  res.json({ success: true, message: "Order cancelled.", data: { order } });
};