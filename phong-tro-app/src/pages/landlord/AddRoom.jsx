import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ToastContainer, { useToast } from "../../components/Toast";
import { getImgUrl } from "../../utils/getImgUrl";

const AMENITIES_LIST = ["WiFi", "Điều hòa", "WC riêng", "Bếp", "Máy giặt", "Tủ lạnh", "Bảo vệ 24/7", "Chỗ để xe", "Thang máy", "Hồ bơi", "Ban công", "Canteen"];
const DISTRICTS_BY_PROVINCE = {
  "TP. Hồ Chí Minh": ["Quận 1","Quận 2","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 9","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Tân Bình","Tân Phú","Thủ Đức","Bình Chánh","Hóc Môn","Nhà Bè"],
  "Hà Nội": ["Ba Đình","Hoàn Kiếm","Đống Đa","Hai Bà Trưng","Hoàng Mai","Thanh Xuân","Cầu Giấy","Nam Từ Liêm","Bắc Từ Liêm","Tây Hồ","Long Biên","Hà Đông"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Sơn Trà","Ngũ Hành Sơn","Liên Chiểu","Cẩm Lệ","Hòa Vang"],
  "Bắc Ninh": ["Thành phố Bắc Ninh","Từ Sơn","Tiên Du","Yên Phong","Quế Võ","Lương Tài","Gia Bình"],
};
const TYPES = ["Phòng trọ", "Studio", "Mini Apartment", "Căn hộ", "KTX"];
//hàm khởi tạo 
export default function AddRoom() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const { toasts, toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    area: "",
    address: "",
    province: "TP. Hồ Chí Minh",
    district: "Quận 1",
    type: "Phòng trọ",
    electricPrice: "3500",
    waterPrice: "15000",
    internetPrice: "0",
    amenities: [],
    images: [],
  });
//hàm cập nhật dữ liệu form
  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };
//hàm upload hình ảnh
  const handleImageUpload = async (files) => {
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("images", f));
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set("images", [...form.images, ...res.data.urls]);
    } catch (err) {
      toast("Lỗi upload ảnh!", "error");
    } finally {
      setUploadingImages(false);
    }
  };
//hàm xoá hình ảnh
  const removeImage = (index) => {
    set("images", form.images.filter((_, i) => i !== index));
  };
//hàm bỏ/ chọn các tiện ích
  const toggleAmenity = (a) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };
//hàm validate
  const validate = () => {
    const e = {};
    if (!form.title) e.title = "Vui lòng nhập tên phòng!";
    if (!form.price) e.price = "Vui lòng nhập giá thuê!";
    if (!form.area) e.area = "Vui lòng nhập diện tích!";
    if (!form.address) e.address = "Vui lòng nhập địa chỉ!";
    if (!form.description) e.description = "Vui lòng nhập mô tả!";
    return e;
  };
//hàm điều hướng và kiểm tra dữ liệu
  const handleNext = () => {
    if (step === 1) {
      const e = {};
      if (!form.title) e.title = "Vui lòng nhập tên phòng!";
      if (!form.type) e.type = "Vui lòng chọn loại phòng!";
      if (!form.district) e.district = "Vui lòng chọn quận!";
      if (!form.address) e.address = "Vui lòng nhập địa chỉ!";
      if (Object.keys(e).length > 0) { setErrors(e); return; }
    }
    if (step === 2) {
      const e = {};
      if (!form.price) e.price = "Vui lòng nhập giá thuê!";
      if (!form.area) e.area = "Vui lòng nhập diện tích!";
      if (Object.keys(e).length > 0) { setErrors(e); return; }
    }
    setStep(s => s + 1);
  };
//hàm gửi dữ liệu đăng phòng
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (!user || user.role === "tenant") {
      toast("Bạn cần tài khoản chủ nhà để đăng phòng!", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/rooms`, {
        ...form,
        price: Number(form.price),
        area: Number(form.area),
        electricPrice: Number(form.electricPrice),
        waterPrice: Number(form.waterPrice),
        internetPrice: Number(form.internetPrice),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi đăng phòng!", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: `1.5px solid ${errors[field] ? "#ff4444" : "#e5e2da"}`,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "Nunito", transition: "border 0.2s",
    background: "#fff"
  });

  const STEPS = ["Thông tin cơ bản", "Giá & Chi phí", "Ảnh & Tiện ích", "Xem lại"];

  if (!user || user.role === "tenant") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito", background: "#f8f7f4" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontWeight: 900 }}>Không có quyền truy cập</h2>
          <p style={{ color: "#888" }}>Bạn cần tài khoản chủ nhà để đăng phòng</p>
          <button onClick={() => navigate("/")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito", background: "#f8f7f4" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');`}</style>
        <div style={{ textAlign: "center", background: "#fff", borderRadius: 24, padding: 48, boxShadow: "0 8px 40px rgba(0,0,0,0.1)", maxWidth: 440 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>Đăng phòng thành công!</h2>
          <p style={{ color: "#888", marginBottom: 28 }}>Bài đăng của bạn đang chờ admin phê duyệt. Thường mất 1-2 giờ.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => navigate("/landlord/dashboard")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              📊 Xem Dashboard
            </button>
            <button onClick={() => { setSuccess(false); setStep(1); setForm({ title: "", description: "", price: "", area: "", address: "", province: "TP. Hồ Chí Minh", district: "Quận 1", type: "Phòng trọ", electricPrice: "3500", waterPrice: "15000", internetPrice: "0", amenities: [], images: [] }); }}
              style={{ padding: "12px 24px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, cursor: "pointer" }}>
              ➕ Đăng phòng khác
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate("/landlord/dashboard")} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← Dashboard</button>
          <span style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>👤 {user.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "88px 24px 40px" }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, marginBottom: 8 }}>Đăng phòng mới</h1>
        <p style={{ color: "#888", marginBottom: 32, fontSize: 14 }}>Điền đầy đủ thông tin để phòng của bạn được duyệt nhanh hơn</p>

        {/* STEPS */}
        <div style={{ display: "flex", gap: 0, marginBottom: 36, background: "#fff", borderRadius: 16, padding: 6, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 12, cursor: "pointer",
              background: step === i + 1 ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "transparent",
              color: step === i + 1 ? "#fff" : step > i + 1 ? "#2ec4b6" : "#aaa",
              fontWeight: 700, fontSize: 13, transition: "all 0.2s"
            }} onClick={() => step > i + 1 && setStep(i + 1)}>
              {step > i + 1 ? "✅ " : `${i + 1}. `}{s}
            </div>
          ))}
        </div>

        {/* CARD */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 36, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>

          {/* STEP 1 — Thông tin cơ bản */}
          {step === 1 && (
            <div>
              <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 18 }}>📋 Thông tin cơ bản</h3>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tên phòng / tiêu đề *</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="VD: Phòng trọ sạch đẹp gần ĐH Bách Khoa"
                  style={inputStyle("title")} />
                {errors.title && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Loại phòng *</label>
                  <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle("type")}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tỉnh/Thành phố *</label>
                  <select value={form.province} onChange={e => { set("province", e.target.value); set("district", DISTRICTS_BY_PROVINCE[e.target.value]?.[0] || ""); }} style={inputStyle("province")}>
                    {Object.keys(DISTRICTS_BY_PROVINCE).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Quận/Huyện *</label>
                <select value={form.district} onChange={e => set("district", e.target.value)} style={inputStyle("district")}>
                  {(DISTRICTS_BY_PROVINCE[form.province] || []).map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Địa chỉ cụ thể *</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="VD: 123 Đường Lê Văn Việt, Phường Hiệp Phú"
                  style={inputStyle("address")} />
                {errors.address && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{errors.address}</div>}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Mô tả phòng *</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Mô tả chi tiết về phòng, khu vực xung quanh, nội thất, quy định..."
                  style={{ ...inputStyle("description"), resize: "none", height: 120 }} />
                {errors.description && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{errors.description}</div>}
              </div>
            </div>
          )}

          {/* STEP 2 — Giá & Chi phí */}
          {step === 2 && (
            <div>
              <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 18 }}>💰 Giá thuê & Chi phí</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Giá thuê/tháng (đ) *</label>
                  <input value={form.price} onChange={e => set("price", e.target.value)}
                    type="number" placeholder="VD: 3000000"
                    style={inputStyle("price")} />
                  {errors.price && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{errors.price}</div>}
                  {form.price && <div style={{ color: "#ff6b35", fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                    = {new Intl.NumberFormat("vi-VN").format(form.price)}đ/tháng
                  </div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Diện tích (m²) *</label>
                  <input value={form.area} onChange={e => set("area", e.target.value)}
                    type="number" placeholder="VD: 25"
                    style={inputStyle("area")} />
                  {errors.area && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{errors.area}</div>}
                </div>
              </div>

              <div style={{ background: "#f8f7f4", borderRadius: 16, padding: 20, marginBottom: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>⚡ Chi phí điện nước & dịch vụ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { key: "electricPrice", label: "Giá điện (đ/kWh)", placeholder: "3500" },
                    { key: "waterPrice", label: "Giá nước (đ/m³)", placeholder: "15000" },
                    { key: "internetPrice", label: "Internet (đ/tháng)", placeholder: "0 = miễn phí" },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>{field.label}</label>
                      <input value={form[field.key]} onChange={e => set(field.key, e.target.value)}
                        type="number" placeholder={field.placeholder}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "Nunito" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview chi phí */}
              {form.price && (
                <div style={{ background: "rgba(255,107,53,0.05)", border: "1.5px solid rgba(255,107,53,0.15)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#ff6b35", marginBottom: 10 }}>📊 Ước tính chi phí hàng tháng</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <span>Tiền phòng:</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat("vi-VN").format(form.price)}đ</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <span>Điện (~100kWh):</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat("vi-VN").format(Number(form.electricPrice) * 100)}đ</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <span>Nước (~5m³):</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat("vi-VN").format(Number(form.waterPrice) * 5)}đ</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Ảnh & Tiện ích */}
          {step === 3 && (
            <div>
              {/* Upload ảnh */}
              <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 18 }}>📷 Ảnh phòng</h3>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Tối đa 5 ảnh, mỗi ảnh không quá 5MB</p>

              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed #e5e2da", borderRadius: 16, padding: 28, marginBottom: 16,
                cursor: "pointer", background: "#f8f7f4", transition: "border 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ff6b35"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e2da"}
              >
                <input type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={e => handleImageUpload(e.target.files)} />
                <span style={{ fontSize: 32, marginBottom: 8 }}>📤</span>
                <span style={{ fontWeight: 700, color: "#555" }}>
                  {uploadingImages ? "⏳ Đang upload..." : "Bấm để chọn ảnh"}
                </span>
                <span style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>PNG, JPG, WEBP</span>
              </label>

              {form.images.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
                  {form.images.map((url, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1" }}>
                      <img src={getImgUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => removeImage(i)} style={{
                        position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)",
                        border: "none", borderRadius: "50%", width: 24, height: 24,
                        color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>✕</button>
                      {i === 0 && <span style={{ position: "absolute", bottom: 4, left: 4, background: "#ff6b35", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>Ảnh bìa</span>}
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 18 }}>✨ Tiện ích phòng</h3>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Chọn các tiện ích có trong phòng</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {AMENITIES_LIST.map(a => {
                  const icons = { "WiFi": "📶", "Điều hòa": "❄️", "WC riêng": "🚿", "Bếp": "🍳", "Máy giặt": "👕", "Tủ lạnh": "🧊", "Bảo vệ 24/7": "🔒", "Chỗ để xe": "🏍️", "Thang máy": "🛗", "Hồ bơi": "🏊", "Ban công": "🌿", "Canteen": "🍜" };
                  const selected = form.amenities.includes(a);
                  return (
                    <div key={a} onClick={() => toggleAmenity(a)} style={{
                      padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${selected ? "#ff6b35" : "#e5e2da"}`,
                      background: selected ? "rgba(255,107,53,0.05)" : "#fff",
                      display: "flex", alignItems: "center", gap: 8,
                      fontWeight: 700, fontSize: 13,
                      color: selected ? "#ff6b35" : "#555",
                      transition: "all 0.2s"
                    }}>
                      <span>{icons[a] || "✅"}</span> {a}
                      {selected && <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              {form.amenities.length > 0 && (
                <div style={{ marginTop: 20, padding: 14, background: "rgba(46,196,182,0.1)", borderRadius: 12, color: "#2ec4b6", fontWeight: 700, fontSize: 13 }}>
                  ✅ Đã chọn {form.amenities.length} tiện ích: {form.amenities.join(", ")}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Xem lại */}
          {step === 4 && (
            <div>
              <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 18 }}>👀 Xem lại thông tin</h3>
              <div style={{ background: "#f8f7f4", borderRadius: 16, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Tên phòng", value: form.title },
                    { label: "Loại phòng", value: form.type },
                    { label: "Quận/Huyện", value: form.district },
                    { label: "Diện tích", value: `${form.area}m²` },
                    { label: "Giá thuê", value: `${new Intl.NumberFormat("vi-VN").format(form.price)}đ/tháng` },
                    { label: "Giá điện", value: `${form.electricPrice}đ/kWh` },
                    { label: "Giá nước", value: `${form.waterPrice}đ/m³` },
                    { label: "Internet", value: form.internetPrice === "0" ? "Miễn phí" : `${form.internetPrice}đ/tháng` },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #e5e2da" }}>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a1a" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e2da" }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Địa chỉ</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>📍 {form.address}</div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e2da" }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Mô tả</div>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{form.description}</div>
                </div>
                {form.amenities.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e2da" }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Tiện ích</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {form.amenities.map(a => (
                        <span key={a} style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ background: "rgba(247,147,30,0.1)", borderRadius: 12, padding: 14, fontSize: 13, color: "#f7931e", fontWeight: 700 }}>
                ⏳ Sau khi đăng, bài sẽ được admin xét duyệt trong 1-2 giờ
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "space-between" }}>
            <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/landlord/dashboard")}
              style={{ padding: "12px 24px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, cursor: "pointer" }}>
              {step === 1 ? "← Hủy" : "← Quay lại"}
            </button>
            {step < 4 ? (
              <button onClick={handleNext} style={{
                padding: "12px 32px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#ff6b35,#f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>Tiếp theo →</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: "12px 32px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg,#ff6b35,#f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>
                {loading ? "⏳ Đang đăng..." : "🚀 Đăng phòng ngay"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    <ToastContainer toasts={toasts} />
    </>
  );
}
