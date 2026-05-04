const bcrypt = require("bcryptjs");
const { User } = require("../models/index");

// 1. Lấy thông tin cá nhân (đã có từ middleware protect)
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// 2. Cập nhật ảnh đại diện (Local Storage)
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file ảnh!" });
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    await req.user.update({ avatar: avatarUrl });
    
    const user = await User.findByPk(req.user.id, { 
      attributes: { exclude: ["password"] } 
    });
    
    res.json({ message: "Cập nhật ảnh đại diện thành công!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

// 3. Cập nhật thông tin cá nhân (tên, sđt, địa chỉ)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await req.user.update({ name, phone, address });
    
    const user = await User.findByPk(req.user.id, { 
      attributes: { exclude: ["password"] } 
    });
    
    res.json({ message: "Cập nhật thành công!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 4. Đổi mật khẩu
exports.changePassword = async (req, res) => {
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
};

// 5. Lấy danh sách khách thuê (Tenants)
exports.getTenants = async (req, res) => {
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
};

// --- CÁC HÀM DÀNH CHO ADMIN ---

// 6. Admin lấy toàn bộ người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 7. Admin khóa tài khoản
exports.lockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });
    await user.update({ status: "locked" });
    res.json({ message: "Đã khóa tài khoản!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 8. Admin mở khóa tài khoản
exports.unlockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });
    await user.update({ status: "active" });
    res.json({ message: "Đã mở khóa tài khoản!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};