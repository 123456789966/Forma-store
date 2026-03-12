const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    pendingOrders,
    totalCustomers,
    newCustomersThisMonth,
    totalProducts,
    lowStockProducts,
    recentOrders,
    topProducts,
    revenueByMonth,
    ordersByStatus,
  ] = await Promise.all([
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.aggregate([{ $match: { isPaid: true, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.aggregate([{ $match: { isPaid: true, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", createdAt: { $gte: startOfMonth } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
    Order.find().sort("-createdAt").limit(10).populate("user", "name email"),
    Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $first: "$items.name" }, totalSold: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$pricing.total" }, orders: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const totalRev = totalRevenue[0]?.total || 0;
  const monthRev = monthRevenue[0]?.total || 0;
  const lastMonthRev = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = lastMonthRev > 0 ? ((monthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : null;

  res.json({
    success: true,
    data: {
      stats: {
        totalRevenue: totalRev,
        monthRevenue: monthRev,
        revenueGrowth,
        totalOrders,
        pendingOrders,
        totalCustomers,
        newCustomersThisMonth,
        totalProducts,
        lowStockProducts,
      },
      recentOrders,
      topProducts,
      revenueByMonth,
      ordersByStatus,
    },
  });
};

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let query = Order.find(filter).populate("user", "name email").sort("-createdAt").skip(skip).limit(limitNum);

  const [orders, total] = await Promise.all([
    query,
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: { orders, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } } });
};

// ─── PATCH /api/admin/orders/:id/status ──────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  const { status, note, trackingNumber, carrier } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });

  order.status = status;
  order.statusHistory.push({ status, note, updatedBy: req.user._id });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (carrier) order.carrier = carrier;
  if (status === "delivered") { order.isDelivered = true; order.deliveredAt = new Date(); }

  await order.save();
  res.json({ success: true, message: "Order status updated.", data: { order } });
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const filter = {};
  if (role) filter.role = role;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort("-createdAt").skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: { users, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } } });
};

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role, isActive }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, message: "User updated.", data: { user } });
};

// ─── GET /api/admin/inventory ─────────────────────────────────────────────────
exports.getInventory = async (req, res) => {
  const { lowStock } = req.query;
  const filter = { isActive: true };
  if (lowStock === "true") filter.stock = { $lt: 10 };

  const products = await Product.find(filter).select("name emoji category price stock sku").sort("stock");
  res.json({ success: true, data: { products } });
};

// ─── PATCH /api/admin/inventory/:productId ────────────────────────────────────
exports.updateStock = async (req, res) => {
  const { stock, adjustment } = req.body;
  const update = stock !== undefined ? { stock } : { $inc: { stock: adjustment } };
  const product = await Product.findByIdAndUpdate(req.params.productId, update, { new: true });
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, message: "Stock updated.", data: { product } });
};