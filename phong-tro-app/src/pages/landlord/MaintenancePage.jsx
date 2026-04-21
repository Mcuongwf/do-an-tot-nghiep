import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ToastContainer, { useToast } from "../../components/Toast";
import LandlordSidebar from "../../components/LandlordSidebar";
import { SkeletonRow, Pagination } from "../../components/Skeleton";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = ["Tất cả", "Chờ xử lý", "Đang xử lý", "Hoàn thành"];

const STATUS_STYLE = {
  "Chờ xử lý": { bg: "rgba(247,147,30,0.1)", color: "#f7931e" },
  "Đang xử lý": { bg: "rgba(67,97,238,0.1)", color: "#4361ee" },
  "Hoàn thành": { bg: "rgba(46,196,182,0.1)", color: "#2ec4b6" },
};
//hàm khởi tạo của quản lý bảo trì
export default function MaintenancePage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", cost: "", note: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", description: "", roomId: "", userId: "" });
  const { toasts, toast } = useToast();
  const { user } = useAuth();
//hook useeffect để khởi tạo trang
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
    api.get(`/api/rooms/my`).then(res => setRooms(res.data.rooms || [])).catch(() => {});

    api.get(`/api/contracts`).then(res => setContracts(res.data || [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
//hàm lấy dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/maintenance`);
      setList(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
//hàm cập nhật trạng thái
  const handleUpdate = async () => {
    try {
      await api.put(`/api/maintenance/${selected.id}`, updateForm);
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast("Lỗi cập nhật!", "error");
    }
  };
//hàm xoá bảo trì
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa yêu cầu này?")) return;
    try {
      await api.delete(`/api/maintenance/${id}`);
      fetchData();
    } catch (err) {
      toast("Lỗi xóa!", "error");
    }
  };
//hàm thêm bảo trì
  const handleAdd = async () => {
    if (!addForm.title) { toast("Vui lòng nhập tiêu đề!", "error"); return; }
    if (!addForm.description) { toast("Vui lòng nhập mô tả!", "error"); return; }
    if (!addForm.roomId) { toast("Vui lòng chọn phòng!", "error"); return; }
    if (!addForm.userId) { toast("Vui lòng chọn người báo cáo!", "error"); return; }
    try {
      await api.post(`/api/maintenance`, {
        title: addForm.title,
        description: addForm.description,
        room: addForm.roomId,
        reportedBy: addForm.userId,
      });
      setShowAddModal(false);
      setAddForm({ title: "", description: "", roomId: "", userId: "" });
      fetchData();
      toast("Thêm yêu cầu thành công!", "success");
    } catch (err) {
      toast("Lỗi: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const filtered = filterStatus === "Tất cả" ? list : list.filter(i => i.status === filterStatus);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chỉ hiển thị phòng đang cho thuê (có hợp đồng active)
  const rentedRoomIds = new Set(
    contracts
      .filter(c => c.status === "active")
      .map(c => String(c.room_id || c.room?.id))
      .filter(Boolean)
  );
  const rentedRooms = rooms.filter(r => rentedRoomIds.has(String(r.id)));

  // Lọc tenant theo phòng đã chọn (chỉ những người có hợp đồng active với phòng đó, không trùng)
  const tenantsForRoom = addForm.roomId
    ? Object.values(
        contracts
          .filter(c => c.status === "active" && (String(c.room_id) === String(addForm.roomId) || String(c.room?.id) === String(addForm.roomId)))
          .map(c => c.tenant)
          .filter(Boolean)
          .reduce((acc, t) => { acc[t.id] = t; return acc; }, {})
      )
    : [];

  const stats = [
    { label: "Tổng yêu cầu", value: list.length, icon: "🔧", color: "#4361ee" },
    { label: "Chờ xử lý", value: list.filter(i => i.status === "Chờ xử lý").length, icon: "⏳", color: "#f7931e" },
    { label: "Đang xử lý", value: list.filter(i => i.status === "Đang xử lý").length, icon: "🔨", color: "#4361ee" },
    { label: "Hoàn thành", value: list.filter(i => i.status === "Hoàn thành").length, icon: "✅", color: "#2ec4b6" },
  ];

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p);

  const selectStyle = {
    width: "100%", padding: "12px", borderRadius: 10,
    border: "1.5px solid #e5e2da", fontSize: 14,
    fontFamily: "Nunito", outline: "none", background: "#fff"
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: 10,
    border: "1.5px solid #e5e2da", fontSize: 14,
    fontFamily: "Nunito", outline: "none", boxSizing: "border-box"
  };

  return (
    <LandlordSidebar>
    <ToastContainer toasts={toasts} />
      <div style={{ padding: "32px 40px", fontFamily: "'Nunito', sans-serif", overflowY: "auto", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 28 }}>Quản lý bảo trì</h1>
            <p style={{ color: "#888", margin: 0, fontSize: 14 }}>Theo dõi và xử lý các yêu cầu bảo trì từ khách thuê</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: "12px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
          }}>Thêm yêu cầu</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ color: "#888", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
              padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13, fontFamily: "Nunito",
              background: filterStatus === s ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
              color: filterStatus === s ? "#fff" : "#888",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>{s}</button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
                <div style={{ fontWeight: 700 }}>Không có yêu cầu bảo trì nào</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f7f4" }}>
                    {["Tiêu đề", "Phòng", "Người báo cáo", "Trạng thái", "Chi phí", "Ngày tạo", "Thao tác"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 800, color: "#555" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item, i) => (
                    <tr key={item.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ color: "#888", fontSize: 12 }}>{item.description?.slice(0, 50)}...</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#555" }}>
                        <div style={{ fontWeight: 700 }}>{item.room?.title || "—"}</div>
                        <div style={{ color: "#aaa", fontSize: 12 }}>{item.room?.address || ""}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>
                        <div style={{ fontWeight: 700 }}>{item.reportedBy?.name || "—"}</div>
                        <div style={{ color: "#aaa", fontSize: 12 }}>{item.reportedBy?.phone || ""}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: STATUS_STYLE[item.status]?.bg || "#f8f7f4",
                          color: STATUS_STYLE[item.status]?.color || "#888"
                        }}>{item.status}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: item.cost > 0 ? "#ff6b35" : "#aaa", fontSize: 13 }}>
                        {item.cost > 0 ? `${formatPrice(item.cost)}đ` : "Chưa có"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#888", fontSize: 13 }}>
                        {item.createdAt?.slice(0, 10)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            disabled={item.status === "Hoàn thành"}
                            onClick={() => { setSelected(item); setUpdateForm({ status: item.status, cost: item.cost || "", note: item.note || "" }); setShowModal(true); }}
                            style={{
                              padding: "6px 12px", borderRadius: 8, border: "none",
                              cursor: item.status === "Hoàn thành" ? "not-allowed" : "pointer",
                              background: item.status === "Hoàn thành" ? "#f0f0f0" : "rgba(67,97,238,0.1)",
                              color: item.status === "Hoàn thành" ? "#bbb" : "#4361ee",
                              fontWeight: 700, fontSize: 12
                            }}>Cập nhật</button>
                          <button onClick={() => handleDelete(item.id)} style={{
                            padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "rgba(255,68,68,0.1)", color: "#ff4444", fontWeight: 700, fontSize: 12
                          }}>Xoá</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* MODAL CẬP NHẬT */}
      {showModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 900, fontSize: 20 }}> Cập nhật bảo trì</h3>
            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{selected.title}</div>
              <div style={{ color: "#888", fontSize: 13 }}>{selected.description}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Trạng thái</label>
              <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} style={selectStyle}>
                <option>Chờ xử lý</option>
                <option>Đang xử lý</option>
                <option>Hoàn thành</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Chi phí sửa chữa (đ)</label>
              <input value={updateForm.cost} onChange={e => setUpdateForm({ ...updateForm, cost: e.target.value })}
                type="number" placeholder="0" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Ghi chú</label>
              <textarea value={updateForm.note} onChange={e => setUpdateForm({ ...updateForm, note: e.target.value })}
                placeholder="Ghi chú thêm..."
                style={{ ...inputStyle, resize: "none", height: 80 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleUpdate} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM YÊU CẦU */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 900, fontSize: 20 }}>Thêm yêu cầu bảo trì</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tiêu đề *</label>
              <input value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                placeholder="VD: Hỏng vòi nước phòng tắm" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Mô tả chi tiết *</label>
              <textarea value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Mô tả chi tiết vấn đề cần sửa chữa..."
                style={{ ...inputStyle, resize: "none", height: 80 }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Chọn phòng *</label>
              <select value={addForm.roomId} onChange={e => setAddForm({ ...addForm, roomId: e.target.value, userId: "" })} style={selectStyle}>
                <option value="">-- Chọn phòng --</option>
                {rentedRooms.map(r => (
                  <option key={r.id} value={r.id}>{r.title} - {r.district}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Người báo cáo *</label>
              <select value={addForm.userId} onChange={e => setAddForm({ ...addForm, userId: e.target.value })} style={selectStyle}
                disabled={!addForm.roomId}>
                <option value="">
                  {!addForm.roomId ? "-- Chọn phòng trước --" : tenantsForRoom.length === 0 ? "-- Không có khách thuê --" : "-- Chọn người báo cáo --"}
                </option>
                {tenantsForRoom.map(u => (
                  <option key={u.id} value={u.id}>{u.name} - {u.phone || u.email}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleAdd} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Thêm yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </LandlordSidebar>
  );
}
