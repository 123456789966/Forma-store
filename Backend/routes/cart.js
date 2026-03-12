// routes/cart.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.use(protect); // all cart routes require auth
router.get("/", ctrl.getCart);
router.post("/add", ctrl.addToCart);
router.put("/update", ctrl.updateCartItem);
router.delete("/remove/:productId", ctrl.removeFromCart);
router.delete("/clear", ctrl.clearCart);
router.post("/coupon", ctrl.applyCoupon);

module.exports = router;