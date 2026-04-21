import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU = [
  { key: "dashboard", label: "Tổng quan", icon: "📊" },
  { key: "users", label: "Quản lý tài khoản", icon: "👥" },
  { key: "rooms", label: "Duyệt bài đăng", icon: "🏠" },
];

export default function AdminSidebar({ active, onMenuChange, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#f0f2f5" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* SIDEBAR */}
      <div style={{
        width: 240, background: "#1a1a2e", color: "#fff",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>🛡️ Admin Panel</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>TrọTốt Management</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {MENU.map(m => (
            <div key={m.key} onClick={() => onMenuChange(m.key)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12, marginBottom: 4,
              cursor: "pointer", fontWeight: 700, fontSize: 14,
              background: active === m.key ? "rgba(255,107,53,0.15)" : "transparent",
              color: active === m.key ? "#ff6b35" : "#aaa",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              {m.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding: "12px 16px", marginBottom: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Quản trị viên</div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: "rgba(255,68,68,0.15)", border: "none",
            color: "#ff4444", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Đăng xuất</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        {children}
      </div>
    </div>
  );
}