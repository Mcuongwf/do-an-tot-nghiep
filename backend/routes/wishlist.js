const express = require("express");
const router = express.Router();
const { User, Room, Wishlist } = require("../models/index");
const { protect } = require("../middleware/auth");

// GET /api/wishlist
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Room, as: "wishlist" }],
    });
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// POST /api/wishlist/toggle
router.post("/toggle", protect, async (req, res) => {
  try {
    const { roomId } = req.body;
    const existing = await Wishlist.findOne({
      where: { user_id: req.user.id, room_id: roomId },
    });
    if (existing) {
      await existing.destroy();
    } else {
      await Wishlist.create({ user_id: req.user.id, room_id: roomId });
    }
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Room, as: "wishlist" }],
    });
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
