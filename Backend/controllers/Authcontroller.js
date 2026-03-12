const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// ─── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already registered." });
  }

  const user = await User.create({ name, email, password });

  const token = generateToken(user._id);
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: { user: user.toSafeObject(), token },
  });
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: "Account has been deactivated." });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Logged in successfully.",
    data: { user: user.toSafeObject(), token },
  });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user: user.toSafeObject() } });
};

// ─── PUT /api/auth/update-profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );
  res.json({ success: true, message: "Profile updated.", data: { user: user.toSafeObject() } });
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, message: "Password changed successfully.", data: { token } });
};

// ─── POST /api/auth/add-address ───────────────────────────────────────────────
exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, message: "Address added.", data: { addresses: user.addresses } });
};

// ─── DELETE /api/auth/address/:addressId ─────────────────────────────────────
exports.deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, message: "Address removed.", data: { addresses: user.addresses } });
};