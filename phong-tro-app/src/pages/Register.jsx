import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("tenant");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    if (form.password !== form.confirm) e.confirm = "Mật khẩu không khớp";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: role,
      });
      login(res.data.token, res.data.user);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      setErrors({ email: err.response?.data?.message || "Đăng ký thất bại" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'Nunito', sans-serif",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      {[
        { w: 500, h: 500, top: -150, right: -150, color: "rgba(255,107,53,0.08)" },
        { w: 350, h: 350, bottom: -100, left: -100, color: "rgba(247,147,30,0.06)" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
          background: c.color, top: c.top, bottom: c.bottom, left: c.left, right: c.right,
          pointerEvents: "none", filter: "blur(40px)"
        }} />
      ))}

      <div style={{ display: "flex", width: "100%", maxWidth: 960, borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>

        {/* LEFT */}
        <div style={{
          flex: 1, background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: "60px 44px", display: "flex", flexDirection: "column",
          justifyContent: "center", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", border: "2px solid rgba(255,107,53,0.2)" }} />
          <div style={{ position: "absolute", bottom: 40, left: -40, width: 160, height: 160, borderRadius: "50%", border: "2px solid rgba(247,147,30,0.15)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
              <img src="/house-icon.png" alt="TrọTốt" style={{ width: 46, height: 46, borderRadius: 14, objectFit: "contain" }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 22, color: "#fff" }}>TrọTốt</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
              Tham gia<br />cùng chúng tôi! 🚀
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
              Tạo tài khoản miễn phí và bắt đầu hành trình tìm kiếm hoặc cho thuê phòng trọ dễ dàng hơn bao giờ hết.
            </p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { value: "2,500+", label: "Phòng trọ" },
                { value: "8,000+", label: "Khách thuê" },
                { value: "1,200+", label: "Chủ nhà" },
                { value: "98%", label: "Hài lòng" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ff6b35" }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex: 1.3, background: "#fff", padding: "48px 48px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 900, color: "#1a1a1a", marginBottom: 12 }}>Tạo tài khoản thành công!</h3>
              <p style={{ color: "#888", fontSize: 15, marginBottom: 32 }}>Chào mừng bạn đến với TrọTốt! 🏠</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => navigate("/login")} style={{
                  padding: "12px 28px", borderRadius: 12, border: "1.5px solid #ff6b35",
                  background: "#fff", color: "#ff6b35", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                }}>Đăng nhập</button>
                <button onClick={() => navigate("/")} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                  color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                }}>Về trang chủ</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 900, color: "#1a1a1a", marginBottom: 8 }}>Tạo tài khoản</h2>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
                  Đã có tài khoản?{" "}
                  <span onClick={() => navigate("/login")} style={{ color: "#ff6b35", fontWeight: 700, cursor: "pointer" }}>
                    Đăng nhập →
                  </span>
                </p>
              </div>

              {/* Role Selector */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {[
                  { value: "tenant", label: "👤 Khách thuê", desc: "Tìm phòng trọ" },
                  { value: "landlord", label: "🏠 Chủ nhà", desc: "Đăng phòng cho thuê" },
                ].map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{
                    flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                    border: role === r.value ? "2px solid #ff6b35" : "2px solid #e5e2da",
                    background: role === r.value ? "rgba(255,107,53,0.06)" : "#fff",
                    fontFamily: "inherit", transition: "all 0.2s", textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 13, color: role === r.value ? "#ff6b35" : "#555" }}>{r.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{r.desc}</p>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>HỌ VÀ TÊN *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: errors.name ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#ff6b35"}
                    onBlur={e => e.target.style.borderColor = errors.name ? "#ef4444" : "#e5e2da"}
                  />
                  {errors.name && <p style={{ color: "#ef4444", fontSize: 12, margin: "3px 0 0" }}>⚠ {errors.name}</p>}
                </div>

                {/* Email + Phone in a row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>EMAIL *</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com" type="email"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: errors.email ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#ff6b35"}
                      onBlur={e => e.target.style.borderColor = errors.email ? "#ef4444" : "#e5e2da"}
                    />
                    {errors.email && <p style={{ color: "#ef4444", fontSize: 11, margin: "3px 0 0" }}>⚠ {errors.email}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>SỐ ĐIỆN THOẠI</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="0912 345 678"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#ff6b35"}
                      onBlur={e => e.target.style.borderColor = "#e5e2da"}
                    />
                  </div>
                </div>

                {/* Password + Confirm in a row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>MẬT KHẨU *</label>
                    <div style={{ position: "relative" }}>
                      <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự" type={showPass ? "text" : "password"}
                        style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: 10, fontSize: 14, border: errors.password ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#ff6b35"}
                        onBlur={e => e.target.style.borderColor = errors.password ? "#ef4444" : "#e5e2da"}
                      />
                      <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#aaa" }}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                    {errors.password && <p style={{ color: "#ef4444", fontSize: 11, margin: "3px 0 0" }}>⚠ {errors.password}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>XÁC NHẬN MK *</label>
                    <div style={{ position: "relative" }}>
                      <input value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                        placeholder="Nhập lại mật khẩu" type={showConfirm ? "text" : "password"}
                        style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: 10, fontSize: 14, border: errors.confirm ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#ff6b35"}
                        onBlur={e => e.target.style.borderColor = errors.confirm ? "#ef4444" : "#e5e2da"}
                      />
                      <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#aaa" }}>
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {errors.confirm && <p style={{ color: "#ef4444", fontSize: 11, margin: "3px 0 0" }}>⚠ {errors.confirm}</p>}
                  </div>
                </div>

                {/* Terms */}
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
                  Bằng cách đăng ký, bạn đồng ý với{" "}
                  <span style={{ color: "#ff6b35", cursor: "pointer", fontWeight: 600 }}>Điều khoản sử dụng</span>
                  {" "}và{" "}
                  <span style={{ color: "#ff6b35", cursor: "pointer", fontWeight: 600 }}>Chính sách bảo mật</span>
                </p>

                <button onClick={handleSubmit} disabled={loading} style={{
                  padding: "13px", borderRadius: 12, border: "none",
                  background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(255,107,53,0.35)", fontFamily: "inherit"
                }}>
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
