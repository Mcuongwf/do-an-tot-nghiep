const { Maintenance, Room, User } = require("../models/index");

// GET /api/maintenance — Landlord xem danh sách bảo trì
exports.getMaintenanceList = async (req, res) => {
  try {
    const myRooms = await Room.findAll({ where: { owner_id: req.user.id }, attributes: ["id"] });
    const roomIds = myRooms.map((r) => r.id);
    const list = await Maintenance.findAll({
      where: { room_id: roomIds },
      include: [
        { model: Room, as: "room", attributes: ["id", "title", "address"] },
        { model: User, as: "reportedBy", attributes: ["id", "name", "phone"] },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /api/maintenance — Tạo yêu cầu bảo trì
exports.createMaintenance = async (req, res) => {
  try {
    const reportedById = req.body.reportedBy || req.user.id;
    const item = await Maintenance.create({ ...req.body, reported_by_id: reportedById, room_id: req.body.room });
    res.status(201).json({ message: "Gửi yêu cầu thành công!", item });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// PUT /api/maintenance/:id — Cập nhật yêu cầu bảo trì
exports.updateMaintenance = async (req, res) => {
  try {
    const item = await Maintenance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });
    await item.update(req.body);
    res.json({ message: "Cập nhật thành công!", item });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// DELETE /api/maintenance/:id — Xóa yêu cầu bảo trì
exports.deleteMaintenance = async (req, res) => {
  try {
    const item = await Maintenance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });
    await item.destroy();
    res.json({ message: "Đã xóa!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};