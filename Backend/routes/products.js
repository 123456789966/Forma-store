const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", ctrl.getProducts);
router.get("/categories", ctrl.getCategories);
router.get("/search/suggestions", ctrl.getSearchSuggestions);
router.get("/:id", ctrl.getProduct);
router.post("/", protect, authorize("admin"), ctrl.createProduct);
router.put("/:id", protect, authorize("admin"), ctrl.updateProduct);
router.delete("/:id", protect, authorize("admin"), ctrl.deleteProduct);
router.post("/:id/reviews", protect, ctrl.addReview);

module.exports = router;