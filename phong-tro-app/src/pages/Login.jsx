import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
export default function Login() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });
  
      // Xóa data cũ trước khi lưu mới
      localStorage.clear();
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setLoading(false);
  
      // Điều hướng theo role
      const role = res.data.user.role;
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "landlord") {
        navigate("/landlord/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoading(false);
      setErrors({ email: err.response?.data?.message || "Đăng nhập thất bại" });
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
        { w: 500, h: 500, top: -150, left: -150, color: "rgba(255,107,53,0.08)" },
        { w: 350, h: 350, bottom: -100, right: -100, color: "rgba(247,147,30,0.06)" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
          background: c.color, top: c.top, bottom: c.bottom, left: c.left, right: c.right,
          pointerEvents: "none", filter: "blur(40px)"
        }} />
      ))}

      <div style={{ display: "flex", width: "100%", maxWidth: 900, borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>

        {/* LEFT */}
        <div style={{
          flex: 1, background: "linear-gradient(160deg, #ff6b35 0%, #f7931e 60%, #ffb347 100%)",
          padding: "60px 44px", display: "flex", flexDirection: "column",
          justifyContent: "center", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏠</div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 22, color: "#fff" }}>TrọTốt</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
              Chào mừng<br />trở lại! 👋
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
              Đăng nhập để quản lý phòng trọ, theo dõi hợp đồng và kết nối với hàng nghìn khách thuê.
            </p>
            {[
              { icon: "🔒", text: "Bảo mật thông tin tuyệt đối" },
              { icon: "⚡", text: "Kết nối nhanh chóng, tiện lợi" },
              { icon: "💬", text: "Hỗ trợ 24/7 qua chatbot AI" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{item.icon}</div>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex: 1.2, background: "#fff", padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 900, color: "#1a1a1a", marginBottom: 12 }}>Đăng nhập thành công!</h3>
              <p style={{ color: "#888", fontSize: 15, marginBottom: 32 }}>Chào mừng bạn trở lại TrọTốt 🏠</p>
              <button onClick={() => navigate("/")} style={{
                padding: "12px 36px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit"
              }}>Về trang chủ</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 900, color: "#1a1a1a", marginBottom: 8 }}>Đăng nhập</h2>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
                  Chưa có tài khoản?{" "}
                  <span onClick={() => navigate("/register")} style={{ color: "#ff6b35", fontWeight: 700, cursor: "pointer" }}>
                    Đăng ký ngay →
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>EMAIL *</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com" type="email"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, border: errors.email ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#ff6b35"}
                    onBlur={e => e.target.style.borderColor = errors.email ? "#ef4444" : "#e5e2da"}
                  />
                  {errors.email && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>⚠ {errors.email}</p>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>MẬT KHẨU *</label>
                  <div style={{ position: "relative" }}>
                    <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự" type={showPass ? "text" : "password"}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, fontSize: 14, border: errors.password ? "1.5px solid #ef4444" : "1.5px solid #e5e2da", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#ff6b35"}
                      onBlur={e => e.target.style.borderColor = errors.password ? "#ef4444" : "#e5e2da"}
                    />
                    <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa" }}>
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>⚠ {errors.password}</p>}
                </div>

                <div style={{ textAlign: "right", marginTop: -8 }}>
                <span onClick={() => navigate("/forgot-password")} style={{ color: "#ff6b35", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Quên mật khẩu?</span>                
                </div>

                <button onClick={handleSubmit} disabled={loading} style={{
                  padding: "13px", borderRadius: 12, border: "none",
                  background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(255,107,53,0.35)", fontFamily: "inherit"
                }}>
                  {loading ? "⏳ Đang xử lý..." : "🔑 Đăng nhập"}
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
