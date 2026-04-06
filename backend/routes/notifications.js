const express = require("express");
const router = express.Router();
const { Notification } = require("../models/index");
const { protect } = require("../middleware/auth");

router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.user.id },
      order: [["created_at", "DESC"]],
      limit: 30,
    });
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { recipient_id: req.user.id, read: false } }
    );
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { id: req.params.id, recipient_id: req.user.id } }
    );
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
