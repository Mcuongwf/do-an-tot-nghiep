const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "Không có quyền truy cập" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(401).json({ message: "User không tồn tại" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền này" });
  }
  next();
};

const landlordOnly = (req, res, next) => {
  if (req.user.role !== "landlord" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ chủ nhà mới có quyền này" });
  }
  next();
};

module.exports = { protect, adminOnly, landlordOnly };
