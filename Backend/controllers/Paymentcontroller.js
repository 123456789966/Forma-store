const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Cart = require("../models/Cart");

// ─── POST /api/payments/create-payment-intent ─────────────────────────────────
// Call this BEFORE placing the order to get a Stripe client secret for the frontend
exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });

  if (order.isPaid) {
    return res.status(400).json({ success: false, message: "Order already paid." });
  }

  // Convert to cents for Stripe
  const amountCents = Math.round(order.pricing.total * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: req.user._id.toString(),
    },
    description: `Forma Store - ${order.orderNumber}`,
    receipt_email: req.user.email,
  });

  // Save intent ID to order
  order.paymentResult = {
    stripePaymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
  };
  await order.save();

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.pricing.total,
    },
  });
};

// ─── POST /api/payments/confirm ───────────────────────────────────────────────
// Called after Stripe.js confirms the payment on the frontend
exports.confirmPayment = async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return res.status(400).json({ success: false, message: `Payment not completed. Status: ${paymentIntent.status}` });
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "processing";
  order.paymentResult = {
    stripePaymentIntentId: paymentIntent.id,
    stripeChargeId: paymentIntent.latest_charge,
    status: paymentIntent.status,
    paidAt: new Date(),
  };
  order.statusHistory.push({ status: "processing", note: "Payment confirmed via Stripe" });
  await order.save();

  res.json({ success: true, message: "Payment confirmed. Order is being processed.", data: { order } });
};

// ─── POST /api/payments/webhook ───────────────────────────────────────────────
// Raw body required — set in server.js before express.json()
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const order = await Order.findOne({ "paymentResult.stripePaymentIntentId": pi.id });
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "processing";
        order.statusHistory.push({ status: "processing", note: "Payment confirmed via webhook" });
        await order.save();
        console.log(`✅ Webhook: Order ${order.orderNumber} paid`);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const order = await Order.findOne({ "paymentResult.stripePaymentIntentId": pi.id });
      if (order) {
        order.status = "cancelled";
        order.statusHistory.push({ status: "cancelled", note: "Payment failed" });
        await order.save();
        console.log(`❌ Webhook: Payment failed for order ${order.orderNumber}`);
      }
      break;
    }
    case "charge.dispute.created": {
      console.warn("⚠️ Dispute created:", event.data.object.id);
      break;
    }
    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
};

// ─── POST /api/payments/refund/:orderId (admin) ───────────────────────────────
exports.refundOrder = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  if (!order.isPaid) return res.status(400).json({ success: false, message: "Order is not paid." });

  const refund = await stripe.refunds.create({
    payment_intent: order.paymentResult.stripePaymentIntentId,
    reason: req.body.reason || "requested_by_customer",
  });

  order.status = "refunded";
  order.statusHistory.push({ status: "refunded", note: `Refund issued: ${refund.id}` });
  await order.save();

  res.json({ success: true, message: "Refund issued.", data: { refundId: refund.id } });
};