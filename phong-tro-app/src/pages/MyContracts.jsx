import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getImgUrl } from "../utils/getImgUrl";

const STATUS_MAP = {
  active:     { label: "Đang thuê",   color: "#2ec4b6", bg: "rgba(46,196,182,0.1)" },
  expired:    { label: "Đã hết hạn",  color: "#f7931e", bg: "rgba(247,147,30,0.1)" },
  terminated: { label: "Đã thanh lý", color: "#ff4444", bg: "rgba(255,68,68,0.1)" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p || 0);
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "—";
}

export default function MyContracts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    axios.get(`${process.env.REACT_APP_API_URL}/api/contracts/my`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setContracts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const filtered = contracts;

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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ff6b35,#f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← Trang chủ</button>
          <span style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>👤 {user.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "90px 24px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 28, color: "#1a1a1a" }}>Lịch sử thuê phòng</h1>
          <p style={{ color: "#888", margin: 0, fontSize: 14 }}>Danh sách các hợp đồng thuê phòng của bạn</p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>⏳ Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 6 }}>Chưa có hợp đồng nào</div>
            <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>Hãy tìm và đặt lịch xem phòng để bắt đầu thuê</div>
            <button onClick={() => navigate("/")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tìm phòng ngay</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map(c => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.expired;
              const imgs = Array.isArray(c.room?.images) ? c.room.images : [];
              const img = imgs.length > 0 ? getImgUrl(imgs[0]) : null;
              return (
                <div key={c.id} style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.11)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}>

                  {/* Ảnh phòng */}
                  <div style={{ width: 160, flexShrink: 0, background: "#f0ede8", position: "relative", overflow: "hidden" }}>
                    {img ? (
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏠</div>
                    )}
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                      {st.label}
                    </div>
                  </div>

                  {/* Thông tin */}
                  <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 3 }}>{c.room?.title || "—"}</div>
                          <div style={{ color: "#888", fontSize: 13 }}>📍 {c.room?.address || c.room?.district || "—"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, fontSize: 18, color: "#ff6b35" }}>{formatPrice(c.price)}đ</div>
                          <div style={{ color: "#aaa", fontSize: 12 }}>/tháng</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Ngày bắt đầu</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{formatDate(c.startDate)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Ngày kết thúc</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{formatDate(c.endDate)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Tiền cọc</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{formatPrice(c.deposit)}đ</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>Chủ nhà</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.landlord?.name || "—"}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button onClick={() => setSelected(c)} style={{
                        padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: "rgba(67,97,238,0.1)", color: "#4361ee", fontWeight: 700, fontSize: 13
                      }}>Xem chi tiết</button>
                      {c.room?.id && (
                        <button onClick={() => navigate(`/rooms/${c.room.id}`)} style={{
                          padding: "7px 18px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff",
                          color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer"
                        }}>Xem phòng</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>Chi tiết hợp đồng</h3>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color }}>
                {STATUS_MAP[selected.status]?.label}
              </span>
            </div>

            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{selected.room?.title}</div>
              <div style={{ color: "#888", fontSize: 13, marginTop: 3 }}>📍 {selected.room?.address || selected.room?.district}</div>
            </div>

            {[
              { label: "Chủ nhà",      value: selected.landlord?.name },
              { label: "SĐT chủ nhà",  value: selected.landlord?.phone || "—" },
              { label: "Ngày bắt đầu", value: formatDate(selected.startDate) },
              { label: "Ngày kết thúc",value: formatDate(selected.endDate) },
              { label: "Tiền thuê",    value: `${formatPrice(selected.price)}đ/tháng` },
              { label: "Tiền cọc",     value: `${formatPrice(selected.deposit)}đ` },
              { label: "Giá điện",     value: `${formatPrice(selected.electricPrice)}đ/kWh` },
              { label: "Giá nước",     value: `${formatPrice(selected.waterPrice)}đ/m³` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#888", fontSize: 13 }}>{item.label}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{item.value || "—"}</span>
              </div>
            ))}

            {selected.note && (
              <div style={{ background: "#f8f7f4", borderRadius: 10, padding: 14, marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Ghi chú</div>
                <div style={{ fontSize: 13, color: "#555" }}>{selected.note}</div>
              </div>
            )}

            <button onClick={() => setSelected(null)} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
