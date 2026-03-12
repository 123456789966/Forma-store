const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  name: String,
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  zip: { type: String, required: true },
  country: { type: String, default: "US" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema, required: true },
  paymentMethod: {
    type: String,
    enum: ["stripe", "paypal", "cod"],
    default: "stripe",
  },
  paymentResult: {
    stripePaymentIntentId: String,
    stripeChargeId: String,
    status: String,
    paidAt: Date,
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
    default: "pending",
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
  trackingNumber: String,
  carrier: String,
  notes: String,
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "paymentResult.stripePaymentIntentId": 1 });

// ─── Auto-generate order number ───────────────────────────────────────────────
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);