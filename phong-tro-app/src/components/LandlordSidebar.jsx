import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { icon: "📊", label: "Tổng quan", path: "/landlord/dashboard" },
  { icon: "🏠", label: "Quản lý phòng", path: "/landlord/rooms" },
  { icon: "📋", label: "Quản lý hợp đồng", path: "/landlord/contracts" },
  { icon: "🔧", label: "Quản lý bảo trì", path: "/landlord/maintenance" },
  { icon: "💬", label: "Tin nhắn", path: "/messages" },
  { icon: "➕", label: "Đăng phòng", path: "/landlord/add-room" },
  { icon: "👤", label: "Hồ sơ", path: "/profile" },
];

export default function LandlordSidebar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (item) => location.pathname === item.path;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Nunito', sans-serif", background: "#f0f2f5", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');`}</style>

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
          <img onClick={() => navigate("/")} src="/house-icon.png" alt="TrọTốt" style={{ width: 38, height: 38, borderRadius: 12, objectFit: "contain", cursor: "pointer", flexShrink: 0 }} />
          {sidebarOpen && <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#fff", whiteSpace: "nowrap" }}>TrọTốt</span>}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          {menuItems.map((item, i) => {
            const active = isActive(item);
            return (
              <button key={i} onClick={() => navigate(item.path)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                marginBottom: 4, textAlign: "left", fontFamily: "inherit",
                background: active ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: active ? 700 : 600,
                fontSize: 14, transition: "all 0.2s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>}
              </button>
            );
          })}
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
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>Chủ nhà</p>
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
          boxShadow: "0 2px 8px rgba(255,107,53,0.4)", zIndex: 20
        }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
