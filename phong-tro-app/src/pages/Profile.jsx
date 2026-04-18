import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getImgUrl } from "../utils/getImgUrl";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { logout, updateUser } = useAuth();
  const token = localStorage.getItem("token");
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setForm({
          name: parsed.name || "",
          phone: parsed.phone || "",
          address: parsed.address || "",
        });
      }
      // Gọi API cập nhật data mới nhất
      if (token) {
        const res = await api.get('/api/users/me');
        setUser(res.data);
        setForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });
      }
    } catch (err) {
      // Không navigate login, dùng data từ localStorage
    }
  };

  const handleUpdateInfo = async () => {
    if (!form.name) return setError("Vui lòng nhập họ tên!");
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.put('/api/users/me', form);
      let updatedUser = res.data.user;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await api.post('/api/users/me/avatar', formData, { headers: { "Content-Type": "multipart/form-data" } });
        updatedUser = avatarRes.data.user;
        setAvatarFile(null);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      }
      updateUser(updatedUser);
      setUser(updatedUser);
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi cập nhật!");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword) return setError("Vui lòng nhập mật khẩu cũ!");
    if (!passwordForm.newPassword) return setError("Vui lòng nhập mật khẩu mới!");
    if (passwordForm.newPassword.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setError("Mật khẩu xác nhận không khớp!");
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.put('/api/users/change-password', passwordForm);
      setSuccess("Đổi mật khẩu thành công! ");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Mật khẩu cũ không đúng!");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = { admin: "Quản trị viên", landlord: "Chủ nhà", tenant: "Khách thuê" };
  const roleColor = { admin: "#4361ee", landlord: "#ff6b35", tenant: "#2ec4b6" };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "1.5px solid #e5e2da", fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "Nunito", transition: "border 0.2s"
  };

  if (!user) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 16, color: "#888" }}>⏳ Đang tải...</div>;

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
          <img src="/house-icon.png" alt="TrọTốt" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>👤 {user.name}</span>
          <button onClick={handleLogout} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Đăng xuất</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "88px 24px 40px" }}>

        {/* HEADER PROFILE */}
        <div style={{
          background: "linear-gradient(135deg, #ff6b35, #f7931e)",
          borderRadius: 24, padding: "32px 40px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 24, color: "#fff"
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, border: "3px solid rgba(255,255,255,0.4)",
            overflow: "hidden",
          }}>
            {user.avatar
              ? <img loading="lazy" src={getImgUrl(user.avatar)} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span>👤</span>}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 24 }}>{user.name}</h2>
            <p style={{ margin: "0 0 8px", opacity: 0.85, fontSize: 14 }}>{user.email}</p>
            <span style={{
              background: "rgba(255,255,255,0.2)", padding: "4px 14px",
              borderRadius: 20, fontSize: 12, fontWeight: 700
            }}>
              {roleLabel[user.role] || user.role}
            </span>
          </div>
          {user.role === "landlord" && (
            <button onClick={() => navigate("/landlord/dashboard")} style={{
              padding: "10px 20px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)",
              background: "transparent", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}>Dashboard</button>
          )}
          {user.role === "admin" && (
            <button onClick={() => navigate("/admin/dashboard")} style={{
              padding: "10px 20px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)",
              background: "transparent", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}>🛡️ Admin Panel</button>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#fff", borderRadius: 14, padding: 6, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", width: "fit-content" }}>
          {[
            { key: "info", label: "Thông tin cá nhân" },
            { key: "password", label: "Đổi mật khẩu" },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setError(""); setSuccess(""); }} style={{
              padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 14, fontFamily: "Nunito",
              background: activeTab === tab.key ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#888",
              transition: "all 0.2s"
            }}>{tab.label}</button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 36, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          {/* Thông báo */}
          {success && <div style={{ background: "rgba(46,196,182,0.1)", color: "#2ec4b6", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontWeight: 700, fontSize: 14 }}>{success}</div>}
          {error && <div style={{ background: "rgba(255,68,68,0.1)", color: "#ff4444", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontWeight: 700, fontSize: 14 }}>⚠️ {error}</div>}

          {/* Tab Thông tin */}
          {activeTab === "info" && (
            <div>
              <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 18, color: "#1a1a1a" }}>📝 Thông tin cá nhân</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Họ và tên *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nguyễn Văn A" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Email</label>
                  <input value={user.email} disabled
                    style={{ ...inputStyle, background: "#f8f7f4", color: "#aaa", cursor: "not-allowed" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Số điện thoại</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0912345678" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Địa chỉ</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Ảnh đại diện</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e5e2da", fontSize: 13, cursor: "pointer", fontFamily: "Nunito" }} />
                  {avatarFile && <span style={{ color: "#2ec4b6", fontSize: 13, fontWeight: 700 }}>✔ {avatarFile.name}</span>}
                </div>
              </div>
              <button onClick={handleUpdateInfo} disabled={loading} style={{
                padding: "13px 32px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}

          {/* Tab Đổi mật khẩu */}
          {activeTab === "password" && (
            <div style={{ maxWidth: 420 }}>
              <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 18, color: "#1a1a1a" }}>🔒 Đổi mật khẩu</h3>
              {[
                { key: "oldPassword", label: "Mật khẩu cũ", placeholder: "Nhập mật khẩu cũ" },
                { key: "newPassword", label: "Mật khẩu mới", placeholder: "Tối thiểu 6 ký tự" },
                { key: "confirmPassword", label: "Xác nhận mật khẩu mới", placeholder: "Nhập lại mật khẩu mới" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>{field.label}</label>
                  <input
                    value={passwordForm[field.key]}
                    onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                    type="password" placeholder={field.placeholder} style={inputStyle}
                  />
                </div>
              ))}
              <button onClick={handleChangePassword} disabled={loading} style={{
                padding: "13px 32px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>
                {loading ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
