const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin")); // all admin routes: must be admin

router.get("/dashboard", ctrl.getDashboard);
router.get("/orders", ctrl.getAllOrders);
router.patch("/orders/:id/status", ctrl.updateOrderStatus);
router.get("/users", ctrl.getAllUsers);
router.patch("/users/:id", ctrl.updateUser);
router.get("/inventory", ctrl.getInventory);
router.patch("/inventory/:productId", ctrl.updateStock);

module.exports = router;