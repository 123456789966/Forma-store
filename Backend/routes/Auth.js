const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/register", registerRules, validate, ctrl.register);
router.post("/login", loginRules, validate, ctrl.login);
router.get("/me", protect, ctrl.getMe);
router.put("/update-profile", protect, ctrl.updateProfile);
router.put("/change-password", protect, ctrl.changePassword);
router.post("/add-address", protect, ctrl.addAddress);
router.delete("/address/:addressId", protect, ctrl.deleteAddress);

module.exports = router;