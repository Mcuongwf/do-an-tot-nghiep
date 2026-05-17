const { Op } = require("sequelize");
const { Room, User } = require("../models/index");

// 1. Lấy danh sách phòng của chủ nhà hiện tại
exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { owner_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.json({ rooms, total: rooms.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Admin lấy tất cả các phòng trong hệ thống
exports.getAllRoomsAdmin = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: User, as: "owner", attributes: ["id", "name", "phone", "email"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ rooms, total: rooms.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3. Lấy danh sách phòng công khai 
exports.getRoomsListing = async (req, res) => {
  try {
    const { province, district, districts, type, minPrice, maxPrice, search, sort, page = 1, limit = 9 } = req.query;
    const where = { postStatus: "approved", status: "Còn trống" };

    if (district) {
      where.district = district;
    } else if (province) {
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
};

// 4. Chi tiết một phòng
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name", "phone", "email"] }],
    });
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 5. Tạo phòng mới
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create({ ...req.body, owner_id: req.user.id });
    res.status(201).json({ message: "Tạo phòng thành công!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 6. Cập nhật thông tin phòng
exports.updateRoom = async (req, res) => {
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
};

// 7. Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    if (room.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền xóa" });
    }
    if (room.status === "Đang thuê") {
      return res.status(400).json({ 
        message: "Không thể xóa phòng trọ đang có người thuê. Vui lòng chấm dứt hợp đồng trước khi thực hiện." 
      });
    }
    await room.destroy();
    res.json({ message: "Xóa phòng thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 8. Duyệt bài đăng (Admin)
exports.approveRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy" });
    await room.update({ postStatus: "approved" });
    res.json({ message: "Đã duyệt bài đăng!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 9. Từ chối bài đăng (Admin)
exports.rejectRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy" });
    await room.update({ postStatus: "rejected" });
    res.json({ message: "Đã từ chối bài đăng!", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};