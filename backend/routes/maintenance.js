const express = require("express");
const router = express.Router();
const { Maintenance, Room, User } = require("../models/index");
const { protect, landlordOnly } = require("../middleware/auth");

router.get("/", protect, landlordOnly, async (req, res) => {
  try {
    const myRooms = await Room.findAll({ where: { owner_id: req.user.id }, attributes: ["id"] });
    const roomIds = myRooms.map(r => r.id);
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
});

router.post("/", protect, landlordOnly, async (req, res) => {
  try {
    const reportedById = req.body.reportedBy || req.user.id;
    const item = await Maintenance.create({ ...req.body, reported_by_id: reportedById, room_id: req.body.room });
    res.status(201).json({ message: "Gửi yêu cầu thành công!", item });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const item = await Maintenance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });
    await item.update(req.body);
    res.json({ message: "Cập nhật thành công!", item });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.delete("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const item = await Maintenance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy" });
    await item.destroy();
    res.json({ message: "Đã xóa!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
