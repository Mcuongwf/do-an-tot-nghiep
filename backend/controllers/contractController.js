const { Contract, Room, User } = require("../models/index");

// GET /api/contracts/my — Tenant xem hợp đồng của mình
exports.getMyContracts = async (req, res) => {
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
};

// GET /api/contracts — Landlord xem tất cả hợp đồng
exports.getLandlordContracts = async (req, res) => {
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
};

// POST /api/contracts — Tạo hợp đồng
exports.createContract = async (req, res) => {
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
};

// PUT /api/contracts/:id — Cập nhật hợp đồng
exports.updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy" });
    const updateData = { ...req.body };
    if (req.body.status === "terminated" && !contract.terminatedAt) {
      updateData.terminatedAt = new Date().toISOString().slice(0, 10);
    }
    await contract.update(updateData);
    res.json({ message: "Cập nhật thành công!", contract });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// DELETE /api/contracts/:id — Thanh lý hợp đồng
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy" });
    await Room.update({ status: "Còn trống" }, { where: { id: contract.room_id } });
    await contract.destroy();
    res.json({ message: "Đã thanh lý hợp đồng!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};