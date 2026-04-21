import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getImgUrl } from "../utils/getImgUrl";

const STATUS_MAP = {
  pending:   { label: "Chờ xác nhận", color: "#f59e0b", bg: "#fffbeb" },
  confirmed: { label: "Đã xác nhận",  color: "#10b981", bg: "#f0fdf4" },
  cancelled: { label: "Đã huỷ",       color: "#ef4444", bg: "#fef2f2" },
};

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    api.get('/api/bookings').then(res => {
      setBookings(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    setCancelling(id);
    try {
      await api.put(`/api/bookings/${id}`, { status: "cancelled" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    } catch {
      alert("Hủy lịch thất bại, vui lòng thử lại.");
    } finally {
      setCancelling(null);
    }
  };

  return (
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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← Quay lại</button>
          <button onClick={() => navigate("/my-contracts")} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Lịch sử thuê</button>
          <span style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>👤 {user.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "88px 24px 40px" }}>
        <h1 style={{ fontWeight: 900, fontSize: 26, marginBottom: 4 }}>📅 Lịch hẹn xem phòng</h1>
        <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>Danh sách lịch hẹn bạn đã đặt</p>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { key: "all", label: "Tất cả" },
            { key: "pending", label: "Chờ xác nhận" },
            { key: "confirmed", label: "Đã xác nhận" },
            { key: "cancelled", label: "Đã huỷ" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: "pointer",
              border: "none",
              background: filter === tab.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
              color: filter === tab.key ? "#fff" : "#555",
              boxShadow: filter === tab.key ? "0 2px 10px rgba(255,107,53,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
            }}>{tab.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa", fontSize: 15 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, color: "#888" }}>Chưa có lịch hẹn nào</div>
            <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tìm phòng ngay</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map(b => {
              const st = STATUS_MAP[b.status] || STATUS_MAP.pending;
              return (
                <div key={b.id} style={{ background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 18, alignItems: "flex-start" }}>
                  {/* Ảnh phòng */}
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#ff6b35,#f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                    {b.room?.images?.[0]
                      ? <img loading="lazy" src={getImgUrl(b.room.images[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "🏠"
                    }
                  </div>

                  {/* Thông tin */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.room?.title || "Phòng đã xoá"}
                      </h3>
                      <span style={{ flexShrink: 0, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}><img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />{b.room?.address || "—"}</p>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>📅 {b.date}</span>
                      <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>🕐 {b.time}</span>
                      {b.room?.price && (
                        <span style={{ fontSize: 13, color: "#ff6b35", fontWeight: 700 }}>
                          {(b.room.price / 1000000).toFixed(1)} tr/tháng
                        </span>
                      )}
                    </div>

                    {b.note && (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#aaa", fontStyle: "italic" }}>Ghi chú: {b.note}</p>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    {b.room?.id && (
                      <button onClick={() => navigate(`/rooms/${b.room.id}`)} style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        Xem phòng
                      </button>
                    )}
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancelling === b.id}
                        style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: cancelling === b.id ? "#fca5a5" : "#fee2e2", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: cancelling === b.id ? "not-allowed" : "pointer" }}
                      >
                        {cancelling === b.id ? "Đang hủy..." : "Hủy lịch"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
