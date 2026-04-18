import { useNavigate } from "react-router-dom";
import { getImgUrl } from "../utils/getImgUrl";

const amenityIcons = {
  "Điều hòa": "❄️", WiFi: "📶", Bếp: "🍳", "Ban công": "🌿",
  "Máy giặt": "🌀", "WC riêng": "🚿", "Tủ lạnh": "🧊", "Bảo vệ 24/7": "🔒",
};

function formatPrice(p) {
  return p >= 1000000
    ? (p / 1000000).toFixed(1).replace(".0", "") + " triệu/tháng"
    : p.toLocaleString() + "đ/tháng";
}

export default function RoomCard({ room, viewMode, isWishlisted, onWishlistToggle }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.14)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer",
        display: viewMode === "list" ? "flex" : "block",
      }}>
      <div style={{
        width: viewMode === "list" ? 200 : "100%", height: viewMode === "list" ? 140 : 180,
        background: "linear-gradient(135deg, #ff6b35, #f7931e)",
        position: "relative", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {room.images && room.images.length > 0
          ? <img loading="lazy" src={getImgUrl(room.images[0])} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 44 }}>🏠</span>}
        <span style={{ position: "absolute", top: 10, left: 10, background: room.status === "Còn trống" ? "#2ec4b6" : "#ff4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{room.status}</span>
        <button onClick={e => { e.stopPropagation(); onWishlistToggle(room.id); }} style={{
          position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
          width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isWishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.4 }}>{room.title}</h3>
        <p style={{ margin: "0 0 8px", color: "#888", fontSize: 12 }}>
          <img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />
          {room.address}
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {[room.type, `${room.area}m²`, `⭐ ${room.rating}`].map((tag, i) => (
            <span key={i} style={{ background: "#f8f7f4", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#555" }}>{tag}</span>
          ))}
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {room.amenities.slice(0, 3).map(a => (
              <span key={a} style={{ background: "#f8f7f4", border: "1px solid #e5e2da", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#666" }}>{amenityIcons[a] || ""} {a}</span>
            ))}
            {room.amenities.length > 3 && <span style={{ fontSize: 11, color: "#aaa" }}>+{room.amenities.length - 3}</span>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#ff6b35" }}>{formatPrice(room.price)}</span>
          <button onClick={e => { e.stopPropagation(); navigate(`/rooms/${room.id}`); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Xem chi tiết</button>
        </div>
      </div>
    </div>
  );
}