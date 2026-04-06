const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { Room } = require("../models/index");
const { Op } = require("sequelize");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getRoomContext(userMessage) {
  try {
    const where = { postStatus: "approved", status: "Còn trống" };

    // Tìm từ khóa địa điểm trong tin nhắn người dùng để lọc phòng
    if (userMessage) {
      const msg = userMessage.toLowerCase();
      const locationKeywords = [
        "quận 1","quận 2","quận 3","quận 4","quận 5","quận 6","quận 7","quận 8","quận 9","quận 10","quận 11","quận 12",
        "bình thạnh","gò vấp","tân bình","tân phú","thủ đức","bình chánh","hóc môn","nhà bè",
        "ba đình","hoàn kiếm","đống đa","hai bà trưng","hoàng mai","thanh xuân","cầu giấy",
        "nam từ liêm","bắc từ liêm","tây hồ","long biên","hà đông",
        "hải châu","thanh khê","sơn trà","ngũ hành sơn","liên chiểu","cẩm lệ",
        "tiên du","từ sơn","yên phong","quế võ",
        "hồ chí minh","hà nội","đà nẵng","bắc ninh",
      ];
      const matched = locationKeywords.find(k => msg.includes(k));
      if (matched) {
        where[Op.or] = [
          { district: { [Op.like]: `%${matched}%` } },
          { province: { [Op.like]: `%${matched}%` } },
          { address: { [Op.like]: `%${matched}%` } },
        ];
      }
    }

    const rooms = await Room.findAll({
      where,
      attributes: ["id", "title", "price", "area", "address", "district", "province", "type", "amenities", "electricPrice", "waterPrice", "rating"],
      limit: 20,
      order: [["rating", "DESC"]],
    });

    if (rooms.length === 0) return "Hiện không có phòng nào phù hợp với khu vực người dùng yêu cầu.";

    const lines = rooms.map(r => {
      const amenities = Array.isArray(r.amenities) && r.amenities.length > 0
        ? r.amenities.join(", ") : "không có thông tin";
      return `- [ID:${r.id}] ${r.title} | Loại: ${r.type} | Giá: ${Number(r.price).toLocaleString("vi-VN")}đ/tháng | DT: ${r.area || "?"}m² | Quận/Huyện: ${r.district || "?"} | Tỉnh/TP: ${r.province || "?"} | Địa chỉ: ${r.address} | Tiện ích: ${amenities} | Điện: ${Number(r.electricPrice).toLocaleString("vi-VN")}đ/kWh | Nước: ${Number(r.waterPrice).toLocaleString("vi-VN")}đ/m³`;
    });

    return `DANH SÁCH PHÒNG PHÙ HỢP (${rooms.length} phòng):\n${lines.join("\n")}`;
  } catch (err) {
    console.error("getRoomContext error:", err.message);
    return "";
  }
}

const BASE_SYSTEM = `Bạn là trợ lý AI của TrọTốt — nền tảng tìm kiếm phòng trọ tại Việt Nam.

VAI TRÒ:
- Tư vấn tìm phòng dựa trên dữ liệu phòng THỰC TẾ được cung cấp
- Trả lời câu hỏi về hợp đồng, tiền cọc, quyền lợi người thuê
- Hướng dẫn sử dụng app: đặt lịch, nhắn tin chủ nhà, yêu thích, bảo trì

QUY TẮC BẮT BUỘC — VI PHẠM LÀ SAI:
1. CHỈ gợi ý phòng có ID trong danh sách. TUYỆT ĐỐI KHÔNG bịa ID, tên, giá, địa chỉ không có trong danh sách.
2. Danh sách có bao nhiêu phòng thì gợi ý TỐI ĐA bấy nhiêu — không được thêm phòng ngoài danh sách.
3. Nếu danh sách trống → nói ngay: "Hiện không có phòng phù hợp tại khu vực này trên hệ thống."
4. Nếu danh sách có ít phòng (1-2 phòng) → chỉ gợi ý đúng số đó, không bổ sung thêm.
5. Khi gợi ý phòng, dùng ĐÚNG định dạng:
   PHONG: [tên phòng] | [giá]đ/tháng | [diện tích]m² | [Quận/Huyện, Tỉnh/TP] | /rooms/[ID]
6. Sao chép NGUYÊN VẸN tên, giá, diện tích, ID từ danh sách — không sửa, không tóm tắt.
7. Tối đa 4 phòng mỗi lần gợi ý.
8. Trả lời ngắn gọn, tiếng Việt tự nhiên, không dùng markdown hay bullet points.`;

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ reply: "Thiếu nội dung tin nhắn" });
    }

    // Lấy tin nhắn cuối của người dùng để lọc phòng theo địa điểm
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.text || "";
    const roomContext = await getRoomContext(lastUserMsg);

    const systemPrompt = roomContext
      ? `${BASE_SYSTEM}\n\n${roomContext}`
      : BASE_SYSTEM;

    const recent = messages.slice(-10);
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...recent.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.1,
    });

    const reply = completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";
    res.json({ reply });
  } catch (err) {
    console.error("Chat AI error:", err.message);
    res.status(500).json({ reply: "Xin lỗi, trợ lý AI tạm thời không khả dụng. Vui lòng thử lại sau! 🙏" });
  }
});

module.exports = router;
