const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Room, User } = require("../models/index");
const { protect, landlordOnly, adminOnly } = require("../middleware/auth");

// GET /api/rooms/my — Phòng của chủ nhà
router.get("/my", protect, async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { owner_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.json({ rooms, total: rooms.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET /api/rooms/all — Admin lấy tất cả phòng
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: User, as: "owner", attributes: ["id", "name", "phone", "email"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ rooms, total: rooms.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET /api/rooms — Public listing
router.get("/", async (req, res) => {
  try {
    const { province, district, districts, type, minPrice, maxPrice, search, sort, page = 1, limit = 9 } = req.query;
    const where = { postStatus: "approved", status: "Còn trống" };

    if (district) {
      where.district = district;
    } else if (province) {
      // Lọc theo province: ưu tiên field province, fallback districts nếu province NULL
      where[Op.or] = [
        { province: province },
        ...(districts ? [{ district: { [Op.in]: districts.split(",") } }] : []),
      ];
    } else if (districts) {
      where.district = { [Op.in]: districts.split(",") };
    }
    if (type) where.type = type;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    let order = [["created_at", "DESC"]];
    if (sort === "price_asc") order = [["price", "ASC"]];
    else if (sort === "price_desc") order = [["price", "DESC"]];

    const offset = (Number(page) - 1) * Number(limit);
    const { count: total, rows: rooms } = await Room.findAndCountAll({
      where,
      include: [{ model: User, as: "owner", attributes: ["id", "name", "phone"] }],
      order,
      offset,
      limit: Number(limit),
    });

    res.json({ rooms, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET /api/rooms/:id — Chi tiết phòng
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name", "phone", "email"] }],
    });
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/rooms — Tạo phòng mới
router.post("/", protect, landlordOnly, async (req, res) => {
  try {
    const room = await Room.create({ ...req.body, owner_id: req.user.id });
    res.status(201).json({ message: "Tạo phòng thành công!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// PUT /api/rooms/:id — Cập nhật phòng
router.put("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    if (room.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa" });
    }
    await room.update(req.body);
    res.json({ message: "Cập nhật thành công!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE /api/rooms/:id — Xóa phòng
router.delete("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    if (room.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền xóa" });
    }
    await room.destroy();
    res.json({ message: "Xóa phòng thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/rooms/:id/approve
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy" });
    await room.update({ postStatus: "approved" });
    res.json({ message: "Đã duyệt bài đăng!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/rooms/:id/reject
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy" });
    await room.update({ postStatus: "rejected" });
    res.json({ message: "Đã từ chối bài đăng!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
