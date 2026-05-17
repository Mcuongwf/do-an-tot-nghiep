import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ToastContainer, { useToast } from "../../components/Toast";
import RoomDetailModal from "../../components/RoomDetailModal";
import LandlordSidebar from "../../components/LandlordSidebar";
import { SkeletonRow, Pagination } from "../../components/Skeleton";

export default function RoomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, toast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("rooms");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [roomPage, setRoomPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get("/api/rooms/my"),
        api.get("/api/bookings/landlord"),
      ]);
      setRooms(roomsRes.data.rooms || []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/rooms/${id}`, { status: newStatus });
      setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast(`Đã cập nhật: ${newStatus}`, "success");
    } catch { toast("Lỗi cập nhật trạng thái!", "error"); }
  };

  // const handleDeleteRoom = async (id) => {
  //   if (!window.confirm("Xác nhận xóa phòng này?")) return;
  //   try {
  //     await api.delete(`/api/rooms/${id}`);
  //     fetchAll();
  //     toast("Đã xóa phòng!", "success");
  //   } catch { toast("Lỗi xóa phòng!", "error"); }
  // };
  const handleDeleteRoom = async (room) => {
    if (room.status === "Đang thuê") {
      toast("Không thể xóa phòng đang có người thuê!", "error");
      return;
    }

    if (!window.confirm(`Xác nhận xóa phòng "${room.title}"?`)) return;
    
    try {
      await api.delete(`/api/rooms/${room.id}`);
      fetchAll();
      toast("Đã xóa phòng!", "success");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi xóa phòng!";
      toast(errorMsg, "error");
    }
  };

  const handleUpdateBooking = async (id, status) => {
    try {
      await api.put(`/api/bookings/${id}`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast(status === "confirmed" ? "Đã xác nhận lịch hẹn!" : "Đã huỷ lịch hẹn!", status === "confirmed" ? "success" : "error");
    } catch { toast("Lỗi cập nhật lịch hẹn!", "error"); }
  };

  const BSTATUS = {
    pending:   { label: "Chờ xác nhận", color: "#f59e0b", bg: "#fffbeb" },
    confirmed: { label: "Đã xác nhận",  color: "#10b981", bg: "#f0fdf4" },
    cancelled: { label: "Đã huỷ",       color: "#ef4444", bg: "#fef2f2" },
  };

  const filteredBookings = bookingFilter === "all" ? bookings : bookings.filter(b => b.status === bookingFilter);
  const totalRoomPages = Math.ceil(rooms.length / PAGE_SIZE);
  const totalBookingPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const pagedRooms = rooms.slice((roomPage - 1) * PAGE_SIZE, roomPage * PAGE_SIZE);
  const shownBookings = filteredBookings.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);

  return (
    <>
      <ToastContainer toasts={toasts} />
      <LandlordSidebar>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

        {/* TOPBAR */}
        <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", padding: "0 28px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>🏠 Quản lý phòng</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>Xin chào, {user?.name} 👋</p>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {loading ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} cols={6} />)}</tbody>
              </table>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {/* TABS + NÚT ĐĂNG PHÒNG */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 4, background: "#f8f7f4", borderRadius: 10, padding: 4 }}>
                  {[
                    { key: "rooms", label: "🏠 Danh sách phòng" },
                    { key: "bookings", label: `📅 Lịch hẹn${bookings.filter(b => b.status === "pending").length > 0 ? ` (${bookings.filter(b => b.status === "pending").length})` : ""}` },
                  ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      padding: "6px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: 13, fontFamily: "Nunito",
                      background: tab === t.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "transparent",
                      color: tab === t.key ? "#fff" : "#888",
                    }}>{t.label}</button>
                  ))}
                </div>
                <button onClick={() => navigate("/landlord/add-room")} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Đăng phòng mới
                </button>
              </div>

              {/* TAB: DANH SÁCH PHÒNG */}
              {tab === "rooms" && (
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
                      {pagedRooms.map((room, i) => (
                        <tr key={room.id || i}
                          style={{ borderTop: "1px solid #f0f2f5", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "14px", fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{room.title}</td>
                          <td style={{ padding: "14px", fontSize: 13, color: "#555" }}>{room.district}</td>
                          <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#ff6b35" }}>{(room.price / 1000000).toFixed(1)} tr</td>
                          <td style={{ padding: "14px" }}>
                            <select value={room.status} onChange={e => handleUpdateStatus(room.id, e.target.value)} style={{
                              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              border: "none", cursor: "pointer", outline: "none", fontFamily: "Nunito",
                              whiteSpace: "nowrap",
                              textAlign: "center",
                              background: room.status === "Đang thuê" ? "#f0fdf4" : room.status === "Còn trống" ? "#fffbeb" : "#fef2f2",
                              color: room.status === "Đang thuê" ? "#10b981" : room.status === "Còn trống" ? "#f59e0b" : "#ef4444",
                            }}>
                              <option value="Còn trống">Còn trống</option>
                              <option value="Đang thuê">Đang thuê</option>
                              <option value="Bảo trì">Bảo trì</option>
                            </select>
                          </td>
                          <td style={{ padding: "14px" }}>
                            <span style={{
                              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: room.postStatus === "approved" ? "#f0fdf4" : room.postStatus === "pending" ? "#fffbeb" : "#fef2f2",
                              color: room.postStatus === "approved" ? "#10b981" : room.postStatus === "pending" ? "#f59e0b" : "#ef4444",
                            }}>
                              {room.postStatus === "approved" ? "Đã duyệt" : room.postStatus === "pending" ? "Chờ duyệt" : "Từ chối"}
                            </span>
                          </td>
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setOpenInEditMode(false); setSelectedRoom(room); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #e5e2da", background: "#fff", fontSize: 12, cursor: "pointer", color: "#555", fontWeight: 600 }}>Chi tiết</button>
                              <button onClick={() => { setOpenInEditMode(true); setSelectedRoom(room); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", fontSize: 12, cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>Sửa</button>
                              {/* <button onClick={() => handleDeleteRoom(room.id)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 12, cursor: "pointer", color: "#ef4444", fontWeight: 600 }}>Xóa</button> */}
                              <button onClick={() => handleDeleteRoom(room)} disabled={room.status === "Đang thuê"} 
                                style={{ 
                                  padding: "5px 12px", 
                                  borderRadius: 7, 
                                  fontSize: 12, 
                                  fontWeight: 600,
                                  cursor: room.status === "Đang thuê" ? "not-allowed" : "pointer", 
                                  border: room.status === "Đang thuê" ? "1px solid #e5e7eb" : "1px solid #fecaca", 
                                  background: room.status === "Đang thuê" ? "#f3f4f6" : "#fef2f2", 
                                  color: room.status === "Đang thuê" ? "#9ca3af" : "#ef4444",
                                  opacity: room.status === "Đang thuê" ? 0.6 : 1,
                                  transition: "all 0.15s ease"
                                }}
                                title={room.status === "Đang thuê" ? "Không thể xóa phòng trọ đang có người thuê" : "Xóa phòng"}
                              >
                                Xóa
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                      {rooms.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>Chưa có phòng nào. Hãy đăng phòng mới!</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination page={roomPage} totalPages={totalRoomPages} onChange={p => setRoomPage(p)} />
                </div>
              )}

              {/* TAB: LỊCH HẸN */}
              {tab === "bookings" && (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "pending", label: "Chờ xác nhận" },
                      { key: "confirmed", label: "Đã xác nhận" },
                      { key: "cancelled", label: "Đã huỷ" },
                    ].map(f => (
                      <button key={f.key} onClick={() => { setBookingFilter(f.key); setBookingPage(1); }} style={{
                        padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none",
                        background: bookingFilter === f.key ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#f0f2f5",
                        color: bookingFilter === f.key ? "#fff" : "#555",
                      }}>{f.label}</button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "#aaa", alignSelf: "center" }}>{shownBookings.length} lịch hẹn</span>
                  </div>

                  {shownBookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48, color: "#aaa" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                      <div style={{ fontWeight: 700 }}>Chưa có lịch hẹn nào</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {shownBookings.map(b => {
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
                  <Pagination page={bookingPage} totalPages={totalBookingPages} onChange={p => setBookingPage(p)} />
                </>
              )}
            </div>
          )}
        </div>
      </LandlordSidebar>

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
