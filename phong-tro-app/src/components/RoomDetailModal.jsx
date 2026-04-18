import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { getImgUrl } from "../utils/getImgUrl";
import { AMENITIES_LIST, ALL_DISTRICTS, ROOM_TYPES } from "../constants";

const TYPES = ROOM_TYPES;
const DISTRICTS = ALL_DISTRICTS;

export default function RoomDetailModal({ selectedRoom, initialEditMode = false, onClose, onRoomUpdated, toast }) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (selectedRoom) {
      setEditMode(initialEditMode);
      setEditForm({
        title: selectedRoom.title || "",
        description: selectedRoom.description || "",
        price: selectedRoom.price || "",
        area: selectedRoom.area || "",
        address: selectedRoom.address || "",
        district: selectedRoom.district || "",
        type: selectedRoom.type || "Phòng trọ",
        electricPrice: selectedRoom.electricPrice || 3500,
        waterPrice: selectedRoom.waterPrice || 15000,
        internetPrice: selectedRoom.internetPrice || 0,
        amenities: selectedRoom.amenities || [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  const toggleAmenityEdit = (a) => {
    setEditForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await api.put(`/api/rooms/${selectedRoom.id}`, {
        ...editForm,
        price: Number(editForm.price),
        area: Number(editForm.area),
        electricPrice: Number(editForm.electricPrice),
        waterPrice: Number(editForm.waterPrice),
        internetPrice: Number(editForm.internetPrice),
      });
      onRoomUpdated(res.data.room);
      setEditMode(false);
      toast("Cập nhật phòng thành công!", "success");
    } catch {
      toast("Lỗi cập nhật phòng!", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Ảnh */}
        <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg,#ff6b35,#f7931e)", borderRadius: "24px 24px 0 0", overflow: "hidden" }}>
          {selectedRoom.images?.length > 0
            ? <img loading="lazy" src={getImgUrl(selectedRoom.images[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 64 }}>🏠</div>
          }
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <span style={{ position: "absolute", bottom: 12, left: 16, background: selectedRoom.status === "Còn trống" ? "#2ec4b6" : selectedRoom.status === "Đang thuê" ? "#10b981" : "#f59e0b", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {selectedRoom.status}
          </span>
        </div>

        <div style={{ padding: 28 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 900, color: "#1a1a1a" }}>
            {editMode ? "✏️ Chỉnh sửa phòng" : "📋 Chi tiết phòng"}
          </h3>

          {/* CHẾ ĐỘ XEM */}
          {!editMode && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1a1a1a", flex: 1, paddingRight: 12 }}>{selectedRoom.title}</h2>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#ff6b35", whiteSpace: "nowrap" }}>{(selectedRoom.price / 1000000).toFixed(1)} tr/tháng</span>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
                <img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />
                {selectedRoom.address}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Loại phòng", value: selectedRoom.type },
                  { label: "Diện tích", value: `${selectedRoom.area} m²` },
                  { label: "Quận/Huyện", value: selectedRoom.district },
                  { label: "Bài đăng", value: selectedRoom.postStatus === "approved" ? "Đã duyệt" : selectedRoom.postStatus === "pending" ? "⏳ Chờ duyệt" : "❌ Từ chối" },
                  { label: "Tiền điện", value: `${(selectedRoom.electricPrice || 3500).toLocaleString()}đ/kWh` },
                  { label: "Tiền nước", value: `${(selectedRoom.waterPrice || 15000).toLocaleString()}đ/m³` },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8f7f4", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {selectedRoom.description && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 6 }}>Mô tả</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.7, background: "#f8f7f4", borderRadius: 10, padding: 12 }}>{selectedRoom.description}</p>
                </div>
              )}
              {selectedRoom.amenities?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 }}>Tiện ích</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedRoom.amenities.map(a => (
                      <span key={a} style={{ background: "rgba(255,107,53,0.08)", color: "#ff6b35", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={onClose} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Đóng</button>
            </>
          )}

          {/* CHẾ ĐỘ SỬA */}
          {editMode && (
            <>
              {[
                { label: "Tên phòng", field: "title" },
                { label: "Địa chỉ", field: "address" },
              ].map(({ label, field }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>{label}</label>
                  <input value={editForm[field]} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Nunito" }} />
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Loại phòng</label>
                  <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", fontFamily: "Nunito" }}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Quận/Huyện</label>
                  <select value={editForm.district} onChange={e => setEditForm(p => ({ ...p, district: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", fontFamily: "Nunito" }}>
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Giá thuê (đ/tháng)", field: "price" },
                  { label: "Diện tích (m²)", field: "area" },
                  { label: "Giá điện (đ/kWh)", field: "electricPrice" },
                  { label: "Giá nước (đ/m³)", field: "waterPrice" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>{label}</label>
                    <input type="number" value={editForm[field]} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Nunito" }} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Nunito", resize: "none", height: 90 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tiện ích</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AMENITIES_LIST.map(a => {
                    const sel = editForm.amenities?.includes(a);
                    return (
                      <span key={a} onClick={() => toggleAmenityEdit(a)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${sel ? "#ff6b35" : "#e5e2da"}`, background: sel ? "rgba(255,107,53,0.08)" : "#fff", color: sel ? "#ff6b35" : "#888", transition: "all 0.15s" }}>{a}</span>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSaveEdit} disabled={savingEdit} style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: savingEdit ? "#ccc" : "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: savingEdit ? "not-allowed" : "pointer" }}>
                  {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}