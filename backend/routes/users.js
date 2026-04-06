const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const { User } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, "avatar-" + Date.now() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh!"));
  },
});

router.get("/tenants", protect, async (req, res) => {
  try {
    const tenants = await User.findAll({
      where: { role: "tenant", status: "active" },
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

router.post("/me/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file ảnh!" });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await req.user.update({ avatar: avatarUrl });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    res.json({ message: "Cập nhật ảnh đại diện thành công!", user });
  } catch (error) {
    console.error("Avatar upload error:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await req.user.update({ name, phone, address });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    res.json({ message: "Cập nhật thành công!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });
    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.put("/:id/lock", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });
    await user.update({ status: "locked" });
    res.json({ message: "Đã khóa tài khoản!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.put("/:id/unlock", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });
    await user.update({ status: "active" });
    res.json({ message: "Đã mở khóa tài khoản!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
