const { Review, Room, User } = require("../models/index");

// 1. Tạo đánh giá mới và cập nhật rating trung bình của phòng
exports.createReview = async (req, res) => {
  try {
    // Tạo review mới
    const review = await Review.create({ 
      ...req.body, 
      user_id: req.user.id, 
      room_id: req.body.room 
    });

    // Lấy tất cả đánh giá của phòng này để tính toán lại trung bình
    const reviews = await Review.findAll({ where: { room_id: req.body.room } });
    
    // Logic tính toán: Trung bình cộng = Tổng điểm / Số lượng
    const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;

    // Cập nhật lại thông tin vào bảng Room
    await Room.update(
      { 
        rating: parseFloat(avg.toFixed(1)), 
        reviewCount: reviews.length 
      },
      { where: { id: req.body.room } }
    );

    res.status(201).json({ message: "Đánh giá thành công!", review });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 2. Lấy danh sách đánh giá của một phòng cụ thể
exports.getRoomReviews = async (req, res) => {
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
};