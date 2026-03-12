const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/", ctrl.createOrder);
router.get("/", ctrl.getMyOrders);
router.get("/:id", ctrl.getOrder);
router.put("/:id/cancel", ctrl.cancelOrder);

module.exports = router;