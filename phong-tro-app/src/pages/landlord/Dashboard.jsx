import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ToastContainer, { useToast } from "../../components/Toast";
import LandlordSidebar from "../../components/LandlordSidebar";
import { SkeletonRow } from "../../components/Skeleton";

function formatMoney(n) {
  if (!n || isNaN(n)) return "0 tr";
  return (n / 1000000).toFixed(1) + " tr";
}

const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
//hàm khởi tạo trang dashboard
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, toast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookings, setBookings] = useState([]);
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

  return (
    <>
    <ToastContainer toasts={toasts} />
    <LandlordSidebar>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        {/* TOPBAR */}
        <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>📊 Tổng quan</h1>
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
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 28 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} cols={6} />)}</tbody>
              </table>
            </div>
          ) : (
            <>
              {/* STATS CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
                {[
                  { label: "Tổng số phòng", value: totalRooms, icon: "🏠", color: "#3b82f6", bg: "#eff6ff", change: "phòng" },
                  { label: "Đang cho thuê", value: occupiedRooms, icon: "✅", color: "#10b981", bg: "#f0fdf4", change: totalRooms ? `${Math.round(occupiedRooms/totalRooms*100)}%` : "0%" },
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
              </div>

              {/* CHARTS + MAINTENANCE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>
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
                        <span style={{ fontSize: 16 }}>{m.status === "Chờ xử lý" ? "⏳" : m.status === "Đang xử lý" ? "🔨" : "✅"}</span>
                        <div>
                          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{m.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{m.room?.title || "—"} · {m.status}</p>
                        </div>
                      </div>
                    ))}
                    {maintenance.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 20, fontSize: 13 }}>Không có yêu cầu bảo trì</div>}
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
    </LandlordSidebar>

    </>
  );
}
