const express = require("express");
const router = express.Router();
const { Contract, Room, User } = require("../models/index");
const { protect, landlordOnly } = require("../middleware/auth");

router.get("/my", protect, async (req, res) => {
  try {
    const contracts = await Contract.findAll({
      where: { tenant_id: req.user.id },
      include: [
        { model: Room, as: "room", attributes: ["id", "title", "address", "district", "province", "images"] },
        { model: User, as: "landlord", attributes: ["id", "name", "phone", "email"] },
      ],
      order: [["start_date", "DESC"]],
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/", protect, landlordOnly, async (req, res) => {
  try {
    const contracts = await Contract.findAll({
      where: { landlord_id: req.user.id },
      include: [
        { model: Room, as: "room", attributes: ["id", "title", "address"] },
        { model: User, as: "tenant", attributes: ["id", "name", "phone", "email"] },
      ],
      order: [["start_date", "DESC"]],
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/", protect, landlordOnly, async (req, res) => {
  try {
    const contract = await Contract.create({
      ...req.body,
      landlord_id: req.user.id,
      room_id: req.body.room,
      tenant_id: req.body.tenant,
    });
    await Room.update({ status: "Đang thuê" }, { where: { id: req.body.room } });
    res.status(201).json({ message: "Tạo hợp đồng thành công!", contract });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy" });
    await contract.update(req.body);
    res.json({ message: "Cập nhật thành công!", contract });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.delete("/:id", protect, landlordOnly, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy" });
    await Room.update({ status: "Còn trống" }, { where: { id: contract.room_id } });
    await contract.destroy();
    res.json({ message: "Đã thanh lý hợp đồng!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
