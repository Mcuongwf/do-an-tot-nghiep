const express = require("express");
const router = express.Router();
const { Review, Room, User } = require("../models/index");
const { protect } = require("../middleware/auth");

router.post("/", protect, async (req, res) => {
  try {
    const review = await Review.create({ ...req.body, user_id: req.user.id, room_id: req.body.room });
    const reviews = await Review.findAll({ where: { room_id: req.body.room } });
    const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
    await Room.update(
      { rating: parseFloat(avg.toFixed(1)), reviewCount: reviews.length },
      { where: { id: req.body.room } }
    );
    res.status(201).json({ message: "Đánh giá thành công!", review });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { room_id: req.params.roomId },
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
