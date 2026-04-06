import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ToastContainer, { useToast } from "../../components/Toast";
import { getImgUrl } from "../../utils/getImgUrl";

const MENU = [
  { key: "dashboard", label: "Tổng quan", icon: "📊" },
  { key: "users", label: "Quản lý tài khoản", icon: "👥" },
  { key: "rooms", label: "Duyệt bài đăng", icon: "🏠" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toasts, toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const [filterRoom, setFilterRoom] = useState("Tất cả");
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, roomsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/users`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/all`, { headers }),
      ]);
      setUsers(usersRes.data);
      setRooms(roomsRes.data.rooms || []);
    } catch (err) {
      console.log("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async (id, currentStatus) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const action = currentStatus === "active" ? "lock" : "unlock";
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${id}/${action}`, {}, { headers });
      fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    }
  };

  const handleApproveRoom = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/rooms/${id}/approve`, {}, { headers });
      fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    }
  };

  const handleRejectRoom = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/rooms/${id}/reject`, {}, { headers });
      fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stats = [
    { label: "Tổng người dùng", value: users.length, icon: "👥", color: "#4361ee" },
    { label: "Khách thuê", value: users.filter(u => u.role === "tenant").length, icon: "🙋", color: "#2ec4b6" },
    { label: "Chủ nhà", value: users.filter(u => u.role === "landlord").length, icon: "🏠", color: "#ff6b35" },
    { label: "Chờ duyệt", value: rooms.filter(r => r.postStatus === "pending").length, icon: "⏳", color: "#f7931e" },
  ];

  return (
    <>
    <ToastContainer toasts={toasts} />
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#f0f2f5" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* SIDEBAR */}
      <div style={{
        width: 240, background: "#1a1a2e", color: "#fff",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10
      }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>🛡️ Admin Panel</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>TrọTốt Management</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {MENU.map(m => (
            <div key={m.key} onClick={() => setActive(m.key)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12, marginBottom: 4,
              cursor: "pointer", fontWeight: 700, fontSize: 14,
              background: active === m.key ? "rgba(255,107,53,0.15)" : "transparent",
              color: active === m.key ? "#ff6b35" : "#aaa",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              {m.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding: "12px 16px", marginBottom: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Quản trị viên</div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: "rgba(255,68,68,0.15)", border: "none",
            color: "#ff4444", fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}>🚪 Đăng xuất</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* DASHBOARD */}
        {active === "dashboard" && (
          <div>
            <h1 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 28, color: "#1a1a1a" }}>Tổng quan hệ thống</h1>
            <p style={{ color: "#888", marginBottom: 32, fontSize: 14 }}>Chào mừng quay lại, {user.name}!</p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 16, padding: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${s.color}`
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ color: "#888", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Thao tác nhanh</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {MENU.filter(m => m.key !== "dashboard").map((m, i) => (
                <button key={i} onClick={() => setActive(m.key)} style={{
                  background: "#fff", borderRadius: 16, padding: 28,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "2px solid transparent",
                  cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#333",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b35"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ fontSize: 36 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUẢN LÝ TÀI KHOẢN */}
        {active === "users" && (
          <div>
            <h1 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 28, color: "#1a1a1a" }}>👥 Quản lý tài khoản</h1>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>⏳ Đang tải...</div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f7f4" }}>
                      {["Họ tên", "Email", "Số điện thoại", "Vai trò", "Trạng thái", "Thao tác"].map(h => (
                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 800, color: "#555" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14 }}>{u.name}</td>
                        <td style={{ padding: "14px 16px", color: "#555", fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: "14px 16px", color: "#555", fontSize: 13 }}>{u.phone || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: u.role === "admin" ? "rgba(67,97,238,0.1)" : u.role === "landlord" ? "rgba(255,107,53,0.1)" : "rgba(46,196,182,0.1)",
                            color: u.role === "admin" ? "#4361ee" : u.role === "landlord" ? "#ff6b35" : "#2ec4b6"
                          }}>
                            {u.role === "admin" ? "Admin" : u.role === "landlord" ? "Chủ nhà" : "Khách thuê"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: u.status === "active" ? "rgba(46,196,182,0.1)" : "rgba(255,68,68,0.1)",
                            color: u.status === "active" ? "#2ec4b6" : "#ff4444"
                          }}>
                            {u.status === "active" ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {u.role !== "admin" && (
                            <button onClick={() => handleLockUser(u.id, u.status)} style={{
                              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                              fontWeight: 700, fontSize: 12,
                              background: u.status === "active" ? "rgba(255,68,68,0.1)" : "rgba(46,196,182,0.1)",
                              color: u.status === "active" ? "#ff4444" : "#2ec4b6"
                            }}>
                              {u.status === "active" ? "Khóa" : "Mở khóa"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>Chưa có tài khoản nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DUYỆT BÀI ĐĂNG */}
        {active === "rooms" && (
          <div>
            <h1 style={{ margin: "0 0 16px", fontWeight: 900, fontSize: 26, color: "#1a1a1a" }}>🏠 Duyệt bài đăng</h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { key: "Tất cả", label: `Tất cả (${rooms.length})` },
                { key: "pending",  label: `⏳ Chờ duyệt (${rooms.filter(r => r.postStatus === "pending").length})` },
                { key: "approved", label: `✅ Đã duyệt (${rooms.filter(r => r.postStatus === "approved").length})` },
                { key: "rejected", label: `❌ Từ chối (${rooms.filter(r => r.postStatus === "rejected").length})` },
              ].map(tab => (
                <button key={tab.key} onClick={() => setFilterRoom(tab.key)} style={{
                  padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, fontFamily: "Nunito",
                  background: filterRoom === tab.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
                  color: filterRoom === tab.key ? "#fff" : "#888",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>{tab.label}</button>
              ))}
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>⏳ Đang tải...</div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f7f4" }}>
                      {["Tên phòng", "Chủ nhà", "Giá", "Loại", "Trạng thái", "Thao tác"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#888" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(filterRoom === "Tất cả" ? rooms : rooms.filter(r => r.postStatus === filterRoom)).map((r, i) => (
                      <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>📍 {r.address}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.owner?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{r.owner?.phone || ""}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: "#ff6b35", fontSize: 13, whiteSpace: "nowrap" }}>
                          {new Intl.NumberFormat("vi-VN").format(r.price)}đ
                        </td>
                        <td style={{ padding: "12px 16px", color: "#555", fontSize: 13 }}>{r.type}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: r.postStatus === "approved" ? "rgba(46,196,182,0.1)" : r.postStatus === "rejected" ? "rgba(255,68,68,0.1)" : "rgba(247,147,30,0.1)",
                            color: r.postStatus === "approved" ? "#2ec4b6" : r.postStatus === "rejected" ? "#ff4444" : "#f7931e"
                          }}>
                            {r.postStatus === "approved" ? "✅ Đã duyệt" : r.postStatus === "rejected" ? "❌ Từ chối" : "⏳ Chờ duyệt"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setSelectedRoom(r)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(67,97,238,0.1)", color: "#4361ee", fontWeight: 700, fontSize: 12 }}>Xem</button>
                            {r.postStatus === "pending" && (
                              <>
                                <button onClick={() => handleApproveRoom(r.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(46,196,182,0.1)", color: "#2ec4b6", fontWeight: 700, fontSize: 12 }}>✅ Duyệt</button>
                                <button onClick={() => handleRejectRoom(r.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(255,68,68,0.1)", color: "#ff4444", fontWeight: 700, fontSize: 12 }}>❌ Từ chối</button>
                              </>
                            )}
                            {r.postStatus === "approved" && (
                              <button onClick={() => handleRejectRoom(r.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(255,68,68,0.1)", color: "#ff4444", fontWeight: 700, fontSize: 12 }}>🚫 Gỡ xuống</button>
                            )}
                            {r.postStatus === "rejected" && (
                              <button onClick={() => handleApproveRoom(r.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(46,196,182,0.1)", color: "#2ec4b6", fontWeight: 700, fontSize: 12 }}>↩ Duyệt lại</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rooms.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>Chưa có bài đăng nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* MODAL XEM CHI TIẾT PHÒNG */}
    {selectedRoom && (
      <div onClick={() => setSelectedRoom(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: 500, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          {(() => {
            const imgs = typeof selectedRoom.images === "string" ? JSON.parse(selectedRoom.images || "[]") : (selectedRoom.images || []);
            return imgs[0] ? <img src={getImgUrl(imgs[0])} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "20px 20px 0 0" }} /> : null;
          })()}
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#1a1a1a", flex: 1, paddingRight: 12 }}>{selectedRoom.title}</h3>
              <span style={{ color: "#ff6b35", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap" }}>{Number(selectedRoom.price).toLocaleString("vi-VN")}đ/tháng</span>
            </div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>📍 {selectedRoom.address}{selectedRoom.district ? ", " + selectedRoom.district : ""}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Loại phòng", value: selectedRoom.type },
                { label: "Diện tích", value: `${selectedRoom.area} m²` },
                { label: "Quận/Huyện", value: selectedRoom.district },
                { label: "Trạng thái", value: selectedRoom.postStatus === "approved" ? "✅ Đã duyệt" : selectedRoom.postStatus === "rejected" ? "❌ Từ chối" : "⏳ Chờ duyệt" },
                { label: "Tiền điện", value: `${Number(selectedRoom.electricPrice).toLocaleString("vi-VN")}đ/kWh` },
                { label: "Tiền nước", value: `${Number(selectedRoom.waterPrice).toLocaleString("vi-VN")}đ/m³` },
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8f7f4", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{item.value}</div>
                </div>
              ))}
            </div>
            {selectedRoom.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mô tả</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, background: "#f8f7f4", borderRadius: 10, padding: 12 }}>{selectedRoom.description}</div>
              </div>
            )}
            {Array.isArray(selectedRoom.amenities) && selectedRoom.amenities.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Tiện ích</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedRoom.amenities.map((a, i) => (
                    <span key={i} style={{ background: "#fff7ed", color: "#ff6b35", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setSelectedRoom(null)} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Đóng</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
