const Product = require("../models/Product");

// ─── GET /api/products ────────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  const {
    search, category, minPrice, maxPrice,
    sort = "-createdAt", page = 1, limit = 12,
    featured, inStock
  } = req.query;

  const filter = { isActive: true };

  // Full-text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filter
  if (category && category !== "All") filter.category = category;

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (featured === "true") filter.isFeatured = true;
  if (inStock === "true") filter.stock = { $gt: 0 };

  // Sorting
  const sortMap = {
    price_asc: "price",
    price_desc: "-price",
    rating: "-rating",
    newest: "-createdAt",
    "-createdAt": "-createdAt",
  };
  const sortStr = sortMap[sort] || sort;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortStr).skip(skip).limit(limitNum).select("-reviews"),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    },
  });
};

// ─── GET /api/products/categories ────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true });
  res.json({ success: true, data: { categories } });
};

// ─── GET /api/products/:id ────────────────────────────────────────────────────
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    isActive: true,
  }).populate("reviews.user", "name avatar");

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }
  res.json({ success: true, data: { product } });
};

// ─── POST /api/products (admin) ───────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, message: "Product created.", data: { product } });
};

// ─── PUT /api/products/:id (admin) ────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, message: "Product updated.", data: { product } });
};

// ─── DELETE /api/products/:id (admin) ─────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, message: "Product deactivated." });
};

// ─── POST /api/products/:id/reviews ──────────────────────────────────────────
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });

  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: "You already reviewed this product." });
  }

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.updateRating();
  await product.save();

  res.status(201).json({ success: true, message: "Review added.", data: { rating: product.rating, numReviews: product.numReviews } });
};

// ─── GET /api/products/search/suggestions ────────────────────────────────────
exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: { suggestions: [] } });

  const products = await Product.find({
    name: { $regex: q, $options: "i" },
    isActive: true,
  }).select("name category emoji").limit(6);

  res.json({ success: true, data: { suggestions: products } });
};