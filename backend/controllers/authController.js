const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User } = require("../models/index");

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name, email, password: hashedPassword, phone,
      role: role || "tenant",
    });
    res.status(201).json({
      message: "Đăng ký thành công!",
      user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });
    if (user.status === "locked") return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });
    res.json({
      message: "Đăng nhập thành công!",
      user: { _id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống!" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    await transporter.sendMail({
      from: `"TrọTốt" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác nhận đặt lại mật khẩu",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#ff6b35">Xin chào ${user.name}!</h2>
          <p>Mã xác nhận đặt lại mật khẩu của bạn là:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#ff6b35;text-align:center;padding:16px 0">${code}</div>
          <p style="color:#888;font-size:13px">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với ai.</p>
        </div>
      `,
    });
    res.json({ message: "Đã gửi mã OTP!", name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi email!", error: error.message });
  }
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ message: "Mã OTP không tồn tại hoặc đã hết hạn!" });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "Mã OTP đã hết hạn!" });
  }
  if (record.code !== otp) return res.status(400).json({ message: "Mã OTP không đúng!" });
  res.json({ message: "OTP hợp lệ!" });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = otpStore.get(email);
    if (!record || Date.now() > record.expiresAt || record.code !== otp) {
      return res.status(400).json({ message: "Phiên đặt lại mật khẩu không hợp lệ!" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Email không tồn tại!" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });
    otpStore.delete(email);
    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};