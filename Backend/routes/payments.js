const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

// Webhook must be raw body — handled in server.js before express.json()
router.post("/webhook", ctrl.stripeWebhook);

router.use(protect);
router.post("/create-payment-intent", ctrl.createPaymentIntent);
router.post("/confirm", ctrl.confirmPayment);
router.post("/refund/:orderId", authorize("admin"), ctrl.refundOrder);

module.exports = router;