const { Notification } = require("../models/index");

// 1. Lấy danh sách thông báo của người dùng hiện tại
exports.getNotifications = async (req, res) => {
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
};

// 2. Đánh dấu tất cả thông báo là đã đọc
exports.readAllNotifications = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { recipient_id: req.user.id, read: false } }
    );
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Đánh dấu một thông báo cụ thể là đã đọc
exports.readOneNotification = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { id: req.params.id, recipient_id: req.user.id } }
    );
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};