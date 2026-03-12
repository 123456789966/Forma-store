const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [200, "Name cannot exceed 200 characters"],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: [2000, "Description cannot exceed 2000 characters"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Lighting", "Textiles", "Kitchen", "Office", "Decor", "Accessories", "Other"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  comparePrice: {
    type: Number, // original price for showing discounts
    min: 0,
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
  }],
  emoji: { type: String, default: "📦" }, // fallback display
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "Stock cannot be negative"],
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  tags: [String],
  weight: Number, // grams
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  reviews: [reviewSchema],
  // Computed fields (updated on review save)
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isActive: 1 });
productSchema.index({ slug: 1 });

// ─── Auto-generate slug ───────────────────────────────────────────────────────
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  next();
});

// ─── Virtual: discount percentage ────────────────────────────────────────────
productSchema.virtual("discountPercent").get(function () {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// ─── Method: update rating after review ──────────────────────────────────────
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model("Product", productSchema);