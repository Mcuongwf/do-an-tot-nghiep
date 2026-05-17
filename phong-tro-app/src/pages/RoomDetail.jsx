import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import ToastContainer, { useToast } from "../components/Toast";
import RoomMap from "../components/RoomMap";
import { getImgUrl } from "../utils/getImgUrl";


export default function RoomDetail() {
  const { toasts, toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ date: "", time: "09:00", note: "" });
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    try {
      const [roomRes, reviewsRes] = await Promise.all([
        api.get(`/api/rooms/${id}`),
        api.get(`/api/reviews/${id}`),
      ]);
      setRoom({ ...roomRes.data, reviews: reviewsRes.data });
    } catch (err) {
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) return navigate("/login");
    if (!booking.date) return toast("Vui lòng chọn ngày xem phòng!", "error");
    try {
      await api.post('/api/bookings', { room: id, date: booking.date, time: booking.time, note: booking.note });
      setBookingSuccess(true);
      setShowBooking(false);
      setTimeout(() => setBookingSuccess(false), 4000);
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi đặt lịch!", "error");
    }
  };
  
  const handleReview = async () => {
    if (!user) return navigate("/login");
    if (!review.comment) return toast("Vui lòng nhập nhận xét!", "error");
    try {
      await api.post('/api/reviews', { room: id, rating: review.rating, comment: review.comment });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      setReview({ rating: 5, comment: "" });
      fetchRoom();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi gửi đánh giá!", "error");
    }
  };


  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Nunito" }}>
      <div style={{ textAlign: "center", color: "#888" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontWeight: 700 }}>Đang tải...</div>
      </div>
    </div>
  );

  if (!room) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", background: "#f8f7f4", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🏠</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: "#333" }}>Không tìm thấy phòng</div>
      <div style={{ color: "#aaa", fontSize: 14 }}>Phòng này không tồn tại hoặc đã bị gỡ</div>
      <button onClick={() => navigate("/")} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Xem phòng khác</button>
    </div>
  );

  const r = room;

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e5e2da",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64, boxShadow: "0 2px 20px rgba(0,0,0,0.06)"
      }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <img src="/house-icon.png" alt="TrọTốt" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← Trang chủ</button>
          {user ? (
            <span onClick={() => navigate("/profile")} style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>👤 {user.name}</span>
          ) : (
            <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng nhập</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "84px 24px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20, fontWeight: 600 }}>
          <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#ff6b35" }}>Trang chủ</span>
          {" > "}
          <span onClick={() => navigate("/rooms")} style={{ cursor: "pointer", color: "#ff6b35" }}>Tìm phòng</span>
          {" > "}
          <span style={{ color: "#555" }}>{r.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>

          {/* LEFT */}
          <div>
            {/* Ảnh */}
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 12, position: "relative" }}>
              {r.images && r.images.length > 0 ? (
                <img loading="eager" src={getImgUrl(r.images[activeImg])} alt={r.title}
                  style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ height: 380, background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}><img src="/house-icon.png" alt="TrọTốt" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
              )}
              <span style={{
                position: "absolute", top: 16, left: 16,
                background: r.status === "Còn trống" ? "#2ec4b6" : "#ff4444",
                color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20
              }}>{r.status}</span>
            </div>
            {/* Thumbnails */}
            {r.images && r.images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
                {r.images.map((img, i) => (
                  <img key={i} loading="lazy" src={getImgUrl(img)} alt=""
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 72, height: 56, objectFit: "cover", borderRadius: 10, cursor: "pointer", flexShrink: 0,
                      border: activeImg === i ? "2.5px solid #ff6b35" : "2.5px solid transparent", opacity: activeImg === i ? 1 : 0.7
                    }} />
                ))}
              </div>
            )}

            {/* Thông tin cơ bản */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h1 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: "#1a1a1a", flex: 1 }}>{r.title}</h1>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#ff6b35", whiteSpace: "nowrap", marginLeft: 16 }}>
                  {formatPrice(r.price)}đ/tháng
                </span>
              </div>

              <p style={{ color: "#888", fontSize: 14, margin: "0 0 16px" }}><img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />{r.address}</p>

              {/* Tags */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { icon: "🏠", label: r.type },
                  { icon: "📐", label: `${r.area}m²` },
                  { icon: "⭐", label: `${r.rating}/5 (${r.reviewCount} đánh giá)` },
                  { icon: "⚡", label: `Điện: ${formatPrice(r.electricPrice)}đ/kWh` },
                  { icon: "💧", label: `Nước: ${formatPrice(r.waterPrice)}đ/m³` },
                ].map((tag, i) => (
                  <span key={i} style={{ background: "#f8f7f4", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#555" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>

              {/* Mô tả */}
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Mô tả</h3>
              <p style={{ color: "#555", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{r.description}</p>
            </div>

            {/* Tiện ích */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>✨ Tiện ích</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(r.amenities || []).map((a, i) => {
                  const icons = { "WiFi": "📶", "Điều hòa": "❄️", "WC riêng": "🚿", "Bảo vệ 24/7": "🔒", "Chỗ để xe": "🏍️", "Bếp": "🍳", "Máy giặt": "👕", "Hồ bơi": "🏊" };
                  return (
                    <span key={i} style={{
                      background: "rgba(255,107,53,0.08)", color: "#ff6b35",
                      padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700
                    }}>
                      {icons[a] || ""} {a}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Bản đồ */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}><img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />Vị trí trên bản đồ</h3>
              <RoomMap address={r.address} title={r.title} />
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#888" }}>📌 {r.address}</p>
            </div>

            {/* Đánh giá */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>⭐ Đánh giá & Nhận xét</h3>

              {/* Form đánh giá */}
              <div style={{ background: "#f8f7f4", borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Viết đánh giá của bạn:</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} onClick={() => setReview({ ...review, rating: s })}
                      style={{ fontSize: 24, cursor: "pointer", opacity: s <= review.rating ? 1 : 0.3 }}>⭐</span>
                  ))}
                </div>
                <textarea
                  value={review.comment}
                  onChange={e => setReview({ ...review, comment: e.target.value })}
                  placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e2da",
                    fontSize: 13, resize: "none", height: 80, boxSizing: "border-box",
                    fontFamily: "Nunito", outline: "none"
                  }}
                />
                {reviewSuccess && <div style={{ color: "#2ec4b6", fontWeight: 700, fontSize: 13, marginTop: 8 }}>Đã gửi đánh giá thành công!</div>}
                <button onClick={handleReview} style={{
                  marginTop: 10, padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>Gửi đánh giá</button>
              </div>

              {/* Danh sách đánh giá */}
              {(r.reviews || []).map(rv => (
                <div key={rv.id} style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>👤 {rv.user?.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{rv.createdAt?.slice(0, 10)}</div>
                  </div>
                  <div style={{ marginBottom: 6 }}>{"⭐".repeat(rv.rating)}</div>
                  <p style={{ margin: 0, color: "#555", fontSize: 14 }}>{rv.comment}</p>
                </div>
              ))}

              {(!r.reviews || r.reviews.length === 0) && (
                <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Chưa có đánh giá nào</div>
              )}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div>
            <div style={{ position: "sticky", top: 80 }}>

              {/* Card giá */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(255,107,53,0.12)", marginBottom: 16, border: "1.5px solid rgba(255,107,53,0.1)" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#ff6b35", marginBottom: 20 }}>
                  {formatPrice(r.price)}đ<span style={{ fontSize: 16, fontWeight: 600, color: "#888" }}>/tháng</span>
                </div>

                {/* Nút đặt lịch */}
                {r.status === "Còn trống" ? (
                  <button onClick={() => setShowBooking(true)} style={{
                    width: "100%", padding: "14px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                    color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(255,107,53,0.3)", marginBottom: 10
                  }}>📅 Đặt lịch xem phòng</button>
                ) : (
                  <div style={{ background: "#f8f7f4", borderRadius: 12, padding: 14, textAlign: "center", color: "#aaa", fontWeight: 700, marginBottom: 10 }}>
                    Phòng đã có người thuê
                  </div>
                )}

                <button onClick={() => setShowContact(!showContact)} style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "1.5px solid #ff6b35", background: "transparent",
                  color: "#ff6b35", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  marginBottom: 10
                }}>📞 Liên hệ chủ nhà</button>

                {user && r.owner?.id && String(user.id) !== String(r.owner.id) && (
                  <button onClick={() => navigate(`/messages?with=${r.owner.id}&room=${r.id}`)} style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    border: "none", background: "linear-gradient(135deg, #4361ee, #2ec4b6)",
                    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(67,97,238,0.25)"
                  }}>💬 Nhắn tin chủ nhà</button>
                )}

                {showContact && (
                  <div style={{ marginTop: 16, padding: 16, background: "#f8f7f4", borderRadius: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>
                      👤 {r.owner?.name}
                    </div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>📞 {r.owner?.phone}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>✉️ {r.owner?.email}</div>
                  </div>
                )}

                {bookingSuccess && (
                  <div style={{ marginTop: 12, background: "rgba(46,196,182,0.1)", color: "#2ec4b6", padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 13, textAlign: "center" }}>
                    Đặt lịch thành công! Chủ nhà sẽ liên hệ bạn sớm.
                  </div>
                )}
              </div>

              {/* Thông tin nhanh */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h4 style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 14 }}>📋 Thông tin nhanh</h4>
                {[
                  { label: "Loại phòng", value: r.type },
                  { label: "Diện tích", value: `${r.area}m²` },
                  { label: "Quận/Huyện", value: r.district },
                  { label: "Trạng thái", value: r.status },
                  { label: "Điện", value: `${formatPrice(r.electricPrice || 3500)}đ/kWh` },
                  { label: "Nước", value: `${formatPrice(r.waterPrice || 15000)}đ/m³` },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid #f0f0f0" : "none" }}>
                    <span style={{ color: "#888", fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ĐẶT LỊCH */}
      {showBooking && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20
        }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 20 }}>📅 Đặt lịch xem phòng</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Ngày xem phòng *</label>
              <input type="date" value={booking.date} onChange={e => setBooking({ ...booking, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 14, boxSizing: "border-box", fontFamily: "Nunito" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Giờ xem phòng</label>
              <select value={booking.time} onChange={e => setBooking({ ...booking, time: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 14, boxSizing: "border-box", fontFamily: "Nunito" }}>
                {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Ghi chú</label>
              <textarea value={booking.note} onChange={e => setBooking({ ...booking, note: e.target.value })}
                placeholder="Ghi chú thêm cho chủ nhà..."
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, resize: "none", height: 70, boxSizing: "border-box", fontFamily: "Nunito" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowBooking(false)} style={{
                flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #e5e2da",
                background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer"
              }}>Hủy</button>
              <button onClick={handleBooking} style={{
                flex: 2, padding: "13px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>Xác nhận đặt lịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ToastContainer toasts={toasts} />
    </>
  );
}
