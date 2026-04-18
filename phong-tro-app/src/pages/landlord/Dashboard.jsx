import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ToastContainer, { useToast } from "../../components/Toast";
import RoomDetailModal from "../../components/RoomDetailModal";

const menuItems = [
  { icon: "📊", label: "Tổng quan", key: "dashboard" },
  { icon: "🏠", label: "Quản lý phòng", key: "rooms" },
  { icon: "📋", label: "Quản lý hợp đồng", key: "contracts", path: "/landlord/contracts" },
  { icon: "🔧", label: "Quản lý bảo trì", key: "maintenance", path: "/landlord/maintenance" },
  { icon: "💬", label: "Tin nhắn", key: "messages", path: "/messages" },
  { icon: "➕", label: "Đăng phòng", key: "addroom", path: "/landlord/add-room" },
  { icon: "👤", label: "Hồ sơ", key: "profile", path: "/profile" },
];

function formatMoney(n) {
  if (!n || isNaN(n)) return "0 tr";
  return (n / 1000000).toFixed(1) + " tr";
}

const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
//hàm khởi tạo trang dashboard
export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toasts, toast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [roomSubTab, setRoomSubTab] = useState("rooms");
  const [contracts, setContracts] = useState([]);

  // Tính stats từ data thật
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === "Đang thuê").length;
  const emptyRooms = rooms.filter(r => r.status === "Còn trống").length;
  const pendingMaintenance = maintenance.filter(m => m.status === "Chờ xử lý").length;
  const activeContracts = contracts.filter(c => c.status === "active");
  const totalRevenue = activeContracts.reduce((s, c) => s + (Number(c.price) || 0), 0);
  const totalTenants = new Set(activeContracts.map(c => c.tenant?.id).filter(Boolean)).size; // eslint-disable-line no-unused-vars

  // Chart: doanh thu theo tháng từ hợp đồng active trong năm hiện tại
  const currentYear = new Date().getFullYear();
  const revenueData = MONTHS.map((month, i) => {
    const monthStart = new Date(currentYear, i, 1);
    const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);
    const monthRevenue = contracts
      .filter(c => {
        if (!c.startDate) return false;
        const start = new Date(c.startDate);
        // Hợp đồng thanh lý: dùng terminatedAt làm ngày kết thúc thực tế
        const effectiveEnd = (c.status === "terminated" && c.terminatedAt)
          ? new Date(c.terminatedAt)
          : c.endDate ? new Date(c.endDate) : new Date(9999, 11, 31);
        return start <= monthEnd && effectiveEnd >= monthStart;
      })
      .reduce((s, c) => s + (Number(c.price) || 0), 0);
    return { month, revenue: monthRevenue };
  });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchAll();
    fetchNotifications();
    const interval = setInterval(() => { fetchNotifications(); }, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
//hàm lấy ra danh sách các thông báo
  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put(`/api/notifications/read-all`, {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };
//hàm tài dữ liệu tổng hợp của chủ nhà
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roomsRes, maintenanceRes, bookingsRes, contractsRes] = await Promise.all([
        api.get(`/api/rooms/my`),
        api.get(`/api/maintenance`),
        api.get(`/api/bookings/landlord`),
        api.get(`/api/contracts`),
      ]);
      setRooms(roomsRes.data.rooms || []);
      setMaintenance(maintenanceRes.data || []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
//hàm thay đổi trạng thái
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(
        `/api/rooms/${id}`,
        { status: newStatus }
      );
      setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast(`Đã cập nhật: ${newStatus}`, "success");
    } catch (err) {
      toast("Lỗi cập nhật trạng thái!", "error");
    }
  };
//hàm xoá bài đăng phòng
  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Xác nhận xóa phòng này?")) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      fetchAll();
    } catch (err) {
      toast("Lỗi xóa phòng!", "error");
    }
  };
//hàm cập nhật lịch hẹn
  const handleUpdateBooking = async (id, status) => {
    try {
      await api.put(`/api/bookings/${id}`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast(status === "confirmed" ? "Đã xác nhận lịch hẹn!" : "Đã huỷ lịch hẹn!", status === "confirmed" ? "success" : "error");
    } catch {
      toast("Lỗi cập nhật lịch hẹn!", "error");
    }
  };

  return (
    <>
    <ToastContainer toasts={toasts} />
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Nunito', sans-serif", background: "#f0f2f5", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? 240 : 72, minHeight: "100vh",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0, position: "relative", zIndex: 10,
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)"
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/house-icon.png" alt="TrọTốt" style={{ width: 38, height: 38, borderRadius: 12, objectFit: "contain" }} />
          {sidebarOpen && <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#fff", whiteSpace: "nowrap" }}>TrọTốt</span>}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          {menuItems.map(item => (
            <button key={item.key} onClick={() => item.path ? navigate(item.path) : setActiveMenu(item.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer",
              marginBottom: 4, textAlign: "left", fontFamily: "inherit",
              background: activeMenu === item.key ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "transparent",
              color: activeMenu === item.key ? "#fff" : "rgba(255,255,255,0.6)",
              fontWeight: activeMenu === item.key ? 700 : 600,
              fontSize: 14, transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (activeMenu !== item.key) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if (activeMenu !== item.key) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: "nowrap" }}>{user?.name || "Chủ nhà"}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>{user?.role === "admin" ? "Quản trị viên" : "Chủ nhà"}</p>
              </div>
            )}
          </div>
          <button onClick={() => { logout(); navigate("/login"); }} style={{
            width: "100%", padding: "9px", borderRadius: 10,
            background: "rgba(255,68,68,0.15)", border: "none",
            color: "#ff4444", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: "Nunito",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>
            {sidebarOpen ? "Đăng xuất" : "←"}
          </button>
        </div>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: "absolute", top: 28, right: -14,
          width: 28, height: 28, borderRadius: "50%",
          background: "#ff6b35", border: "none", color: "#fff",
          cursor: "pointer", fontSize: 12, display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(255,107,53,0.4)"
        }}>{sidebarOpen ? "◀" : "▶"}</button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>
              {menuItems.find(m => m.key === activeMenu)?.icon} {menuItems.find(m => m.key === activeMenu)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>Xin chào, {user?.name}! 👋</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* NOTIFICATION BELL */}
            <div style={{ position: "relative" }}>
              <div onClick={() => { setShowNotifications(v => !v); if (!showNotifications && unreadCount > 0) markAllRead(); }}
                style={{ cursor: "pointer", position: "relative", padding: 4 }}>
                <span style={{ fontSize: 22 }}>🔔</span>
                {unreadCount > 0 && (
                  <div style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </div>

              {showNotifications && (
                <div style={{ position: "absolute", top: 44, right: 0, width: 340, background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", zIndex: 999, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>🔔 Thông báo</span>
                    <span onClick={markAllRead} style={{ fontSize: 12, color: "#ff6b35", cursor: "pointer", fontWeight: 700 }}>Đánh dấu tất cả đã đọc</span>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                        Chưa có thông báo nào
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => { setShowNotifications(false); if (n.link) navigate(n.link); }}
                        style={{ padding: "12px 18px", borderBottom: "1px solid #f8f8f8", cursor: "pointer", background: n.read ? "#fff" : "#fff7ed", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f7f4"}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : "#fff7ed"}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.type === "booking" ? "#fff7ed" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                            {n.type === "booking" ? "📅" : n.type === "message" ? "💬" : "🔔"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 13, color: "#1a1a1a", marginBottom: 3 }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{n.body}</div>
                            <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                              {new Date(n.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b35", flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div onClick={() => navigate("/profile")} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#888", fontSize: 16 }}>⏳ Đang tải dữ liệu...</div>
          ) : (
            <>
              {/* STATS CARDS */}
              {activeMenu === "dashboard" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
                {[
                  { label: "Tổng số phòng", value: totalRooms, icon: "🏠", color: "#3b82f6", bg: "#eff6ff", change: "phòng" },
                  { label: "Đang cho thuê", value: occupiedRooms, icon: "", color: "#10b981", bg: "#f0fdf4", change: totalRooms ? `${Math.round(occupiedRooms/totalRooms*100)}%` : "0%" },
                  { label: "Còn trống", value: emptyRooms, icon: "🔑", color: "#f59e0b", bg: "#fffbeb", change: "Cần tìm KH" },
                  { label: "Chờ bảo trì", value: pendingMaintenance, icon: "🔧", color: "#ef4444", bg: "#fef2f2", change: "yêu cầu" },
                  { label: "Tổng doanh thu", value: formatMoney(totalRevenue), icon: "💰", color: "#ff6b35", bg: "#fff7ed", change: "/tháng" },
                ].map((card, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${card.color}`, opacity: 0, animation: `fadeUp 0.4s ${i * 0.08}s forwards` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span style={{ fontSize: 28 }}>{card.icon}</span>
                      <span style={{ background: card.bg, color: card.color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>{card.change}</span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "#888", fontWeight: 600 }}>{card.label}</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#1a1a1a" }}>{card.value}</p>
                  </div>
                ))}
              </div>}

              {/* CHARTS + MAINTENANCE */}
              {activeMenu === "dashboard" && <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>
                {/* Revenue Chart */}
                <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>📈 Doanh thu thực theo tháng ({currentYear})</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => formatMoney(v)} tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => [formatMoney(v), "Doanh thu"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
                      <Bar dataKey="revenue" fill="url(#colorGrad)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff6b35" />
                          <stop offset="100%" stopColor="#f7931e" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Maintenance */}
                <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>🔧 Bảo trì gần đây</h3>
                    <span onClick={() => navigate("/landlord/maintenance")} style={{ color: "#ff6b35", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Xem tất cả →</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {maintenance.slice(0, 4).map(m => (
                      <div key={m.id} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: m.status === "Chờ xử lý" ? "#fff7ed" : m.status === "Đang xử lý" ? "#eff6ff" : "#f0fdf4" }}>
                        <span style={{ fontSize: 16 }}>{m.status === "Chờ xử lý" ? "⏳" : m.status === "Đang xử lý" ? "🔨" : ""}</span>
                        <div>
                          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{m.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{m.room?.title || "—"} · {m.status}</p>
                        </div>
                      </div>
                    ))}
                    {maintenance.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 20, fontSize: 13 }}>Không có yêu cầu bảo trì</div>}
                  </div>
                </div>
              </div>}

              {/* ROOMS TABLE + BOOKINGS */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 4, background: "#f8f7f4", borderRadius: 10, padding: 4 }}>
                    {[{ key: "rooms", label: "🏠 Danh sách phòng" }, { key: "bookings", label: "📅 Lịch hẹn" }].map(t => (
                      <button key={t.key} onClick={() => setRoomSubTab(t.key)} style={{
                        padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontWeight: 700, fontSize: 13, fontFamily: "Nunito",
                        background: roomSubTab === t.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "transparent",
                        color: roomSubTab === t.key ? "#fff" : "#888",
                      }}>
                        {t.label}
                        {t.key === "bookings" && bookings.filter(b => b.status === "pending").length > 0 && (
                          <span style={{ marginLeft: 6, background: roomSubTab === t.key ? "rgba(255,255,255,0.3)" : "#ff6b35", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11 }}>
                            {bookings.filter(b => b.status === "pending").length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {roomSubTab === "rooms" && <button onClick={() => navigate("/landlord/add-room")} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Đăng phòng mới</button>}
                </div>
                {/* Sub-tab: Danh sách phòng */}
                {roomSubTab === "rooms" && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                          {["Tên phòng", "Quận/Huyện", "Giá thuê", "Trạng thái", "Bài đăng", "Thao tác"].map(h => (
                            <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room, i) => (
                          <tr key={room.id || i}
                            style={{ borderTop: "1px solid #f0f2f5", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "14px", fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{room.title}</td>
                            <td style={{ padding: "14px", fontSize: 13, color: "#555" }}>{room.district}</td>
                            <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#ff6b35" }}>{(room.price / 1000000).toFixed(1)} tr</td>
                            <td style={{ padding: "14px" }}>
                              <select
                                value={room.status}
                                onChange={e => handleUpdateStatus(room.id, e.target.value)}
                                style={{
                                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  border: "none", cursor: "pointer", outline: "none", fontFamily: "Nunito",
                                  background: room.status === "Đang thuê" ? "#f0fdf4" : room.status === "Còn trống" ? "#fffbeb" : "#fef2f2",
                                  color: room.status === "Đang thuê" ? "#10b981" : room.status === "Còn trống" ? "#f59e0b" : "#ef4444",
                                }}
                              >
                                <option value="Còn trống">Còn trống</option>
                                <option value="Đang thuê">Đang thuê</option>
                                <option value="Bảo trì">Bảo trì</option>
                              </select>
                            </td>
                            <td style={{ padding: "14px" }}>
                              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: room.postStatus === "approved" ? "#f0fdf4" : room.postStatus === "pending" ? "#fffbeb" : "#fef2f2", color: room.postStatus === "approved" ? "#10b981" : room.postStatus === "pending" ? "#f59e0b" : "#ef4444" }}>
                                {room.postStatus === "approved" ? "Đã duyệt" : room.postStatus === "pending" ? "⏳ Chờ duyệt" : "❌ Từ chối"}
                              </span>
                            </td>
                            <td style={{ padding: "14px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => { setOpenInEditMode(false); setSelectedRoom(room); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #e5e2da", background: "#fff", fontSize: 12, cursor: "pointer", color: "#555", fontWeight: 600 }}>Chi tiết</button>
                                <button onClick={() => { setOpenInEditMode(true); setSelectedRoom(room); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", fontSize: 12, cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>Sửa</button>
                                <button onClick={() => handleDeleteRoom(room.id)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 12, cursor: "pointer", color: "#ef4444", fontWeight: 600 }}>Xóa</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {rooms.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>Chưa có phòng nào. Hãy đăng phòng mới!</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab: Lịch hẹn */}
                {roomSubTab === "bookings" && (() => {
                  const BSTATUS = {
                    pending:   { label: "Chờ xác nhận", color: "#f59e0b", bg: "#fffbeb" },
                    confirmed: { label: "Đã xác nhận",  color: "#10b981", bg: "#f0fdf4" },
                    cancelled: { label: "Đã huỷ",       color: "#ef4444", bg: "#fef2f2" },
                  };
                  const shown = bookingFilter === "all" ? bookings : bookings.filter(b => b.status === bookingFilter);
                  return (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {[
                          { key: "all", label: "Tất cả" },
                          { key: "pending", label: "Chờ xác nhận" },
                          { key: "confirmed", label: "Đã xác nhận" },
                          { key: "cancelled", label: "Đã huỷ" },
                        ].map(tab => (
                          <button key={tab.key} onClick={() => setBookingFilter(tab.key)} style={{
                            padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none",
                            background: bookingFilter === tab.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#f0f2f5",
                            color: bookingFilter === tab.key ? "#fff" : "#555",
                          }}>{tab.label}</button>
                        ))}
                        <span style={{ marginLeft: "auto", fontSize: 13, color: "#aaa", alignSelf: "center" }}>{shown.length} lịch hẹn</span>
                      </div>
                      {shown.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 48, color: "#aaa" }}>
                          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                          <div style={{ fontWeight: 700 }}>Chưa có lịch hẹn nào</div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {shown.map(b => {
                            const st = BSTATUS[b.status] || BSTATUS.pending;
                            return (
                              <div key={b.id} style={{ borderRadius: 12, padding: "14px 16px", border: "1px solid #f0f2f5", display: "flex", gap: 14, alignItems: "center" }}>
                                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                                  {b.tenant?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1a1a1a" }}>{b.tenant?.name || "Khách"}</span>
                                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                                  </div>
                                  <div style={{ fontSize: 13, color: "#555", fontWeight: 600, marginBottom: 2 }}>🏠 {b.room?.title || "—"}</div>
                                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
                                    <span>📅 {b.date}</span>
                                    <span>🕐 {b.time}</span>
                                    {b.tenant?.phone && <span>📞 {b.tenant.phone}</span>}
                                  </div>
                                  {b.note && <div style={{ fontSize: 12, color: "#aaa", marginTop: 3, fontStyle: "italic" }}>Ghi chú: {b.note}</div>}
                                </div>
                                {b.status === "pending" && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => handleUpdateBooking(b.id, "confirmed")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✓ Xác nhận</button>
                                    <button onClick={() => handleUpdateBooking(b.id, "cancelled")} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✕ Huỷ</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {selectedRoom && (
      <RoomDetailModal
        key={`${selectedRoom.id}-${openInEditMode}`}
        selectedRoom={selectedRoom}
        initialEditMode={openInEditMode}
        onClose={() => setSelectedRoom(null)}
        onRoomUpdated={(updated) => {
          setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
          setSelectedRoom(updated);
        }}
        toast={toast}
      />
    )}
    </>
  );
}
