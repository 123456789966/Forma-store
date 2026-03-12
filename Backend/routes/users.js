const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// GET /api/users/profile
router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

module.exports = router;