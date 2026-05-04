const { Booking, Room, User, Notification } = require("../models/index");

// POST /api/bookings — Khách đặt lịch
exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, tenant_id: req.user.id, room_id: req.body.room });
    const room = await Room.findByPk(req.body.room, {
      include: [{ model: User, as: "owner", attributes: ["id", "name"] }],
    });
    if (room?.owner) {
      await Notification.create({
        recipient_id: room.owner.id,
        type: "booking",
        title: "📅 Có khách đặt lịch xem phòng",
        body: `${req.user.name || "Khách"} muốn xem phòng "${room.title}" vào ${req.body.date} lúc ${req.body.time || "09:00"}`,
        link: "/landlord/dashboard",
      });
    }
    res.status(201).json({ message: "Đặt lịch thành công!", booking });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/bookings — Lịch đặt của tenant
exports.getTenantBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { tenant_id: req.user.id },
      include: [{ model: Room, as: "room", attributes: ["id", "title", "address", "price", "images"] }],
      order: [["created_at", "DESC"]],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/bookings/landlord — Chủ nhà xem lịch đặt
exports.getLandlordBookings = async (req, res) => {
  try {
    const myRooms = await Room.findAll({ where: { owner_id: req.user.id }, attributes: ["id"] });
    const roomIds = myRooms.map((r) => r.id);
    const bookings = await Booking.findAll({
      where: { room_id: roomIds },
      include: [
        { model: Room, as: "room", attributes: ["id", "title", "address"] },
        { model: User, as: "tenant", attributes: ["id", "name", "phone", "email"] },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// PUT /api/bookings/:id — Cập nhật trạng thái
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: "tenant", attributes: ["id", "name"] },
        { model: Room, as: "room", attributes: ["id", "title"] },
      ],
    });
    if (!booking) return res.status(404).json({ message: "Không tìm thấy" });
    await booking.update({ status: req.body.status });
    const statusText = req.body.status === "confirmed" ? "✅ đã xác nhận" : "❌ đã huỷ";
    await Notification.create({
      recipient_id: booking.tenant.id,
      type: "booking",
      title: `Lịch xem phòng ${statusText}`,
      body: `Chủ nhà ${statusText} lịch xem phòng "${booking.room?.title}" của bạn`,
      link: "/profile",
    });
    res.json({ message: "Cập nhật thành công!", booking });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};