const { User, Room, Wishlist } = require("../models/index");

// 1. Lấy danh sách yêu thích của người dùng hiện tại
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Room, as: "wishlist" }],
    });
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Thêm hoặc Xóa phòng khỏi danh sách yêu thích (Toggle)
exports.toggleWishlist = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    // Tìm xem phòng này đã có trong wishlist của user chưa
    const existing = await Wishlist.findOne({
      where: { user_id: req.user.id, room_id: roomId },
    });

    if (existing) {
      // Nếu đã có thì xóa đi (Unfavorite)
      await existing.destroy();
    } else {
      // Nếu chưa có thì tạo mới (Favorite)
      await Wishlist.create({ user_id: req.user.id, room_id: roomId });
    }

    // Trả về danh sách wishlist mới sau khi đã cập nhật
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Room, as: "wishlist" }],
    });
    
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};