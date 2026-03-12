const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  qty: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true }, // snapshot at time of add
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [cartItemSchema],
  couponCode: String,
  discount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
});

cartSchema.virtual("total").get(function () {
  return Math.max(0, this.subtotal - this.discount);
});

cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

module.exports = mongoose.model("Cart", cartSchema);