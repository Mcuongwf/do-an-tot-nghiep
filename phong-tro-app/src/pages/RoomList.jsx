import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getImgUrl } from "../utils/getImgUrl";

import { PROVINCES_FILTER, DISTRICTS_BY_PROVINCE, ROOM_TYPES_FILTER } from "../constants";
const PROVINCES = PROVINCES_FILTER;
const TYPES = ROOM_TYPES_FILTER;
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp → cao", value: "price_asc" },
  { label: "Giá cao → thấp", value: "price_desc" },
];


export default function RoomList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("Tất cả");
  const [district, setDistrict] = useState("Tất cả");
  const [type, setType] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [wishlist, setWishlist] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 9;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRooms(1);
    if (user && token) fetchWishlist();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchRooms(1);
  }, [search, province, district, type, minPrice, maxPrice, sort]);

  const fetchRooms = async (p = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search) params.append("search", search);
      if (district !== "Tất cả") {
        params.append("district", district);
      } else if (province !== "Tất cả") {
        params.append("province", province);
        const districtList = DISTRICTS_BY_PROVINCE[province] || [];
        if (districtList.length) params.append("districts", districtList.join(","));
      }
      if (type !== "Tất cả") params.append("type", type);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (sort !== "newest") params.append("sort", sort);
      const res = await api.get(`/api/rooms?${params}`);
      if (res.data.rooms) {
        setRooms(res.data.rooms);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get(`/api/wishlist`);
      setWishlist(res.data.wishlist.map(r => r.id || r));
    } catch (err) {}
  };

  const toggleWishlist = async (id) => {
    if (!user || !token) return;
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      const res = await api.post(
        `/api/wishlist/toggle`,
        { roomId: id }
      );
      setWishlist(res.data.wishlist.map(r => r.id || r));
    } catch (err) {}
  };

  const filtered = rooms;

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p) + "đ/tháng";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e5e2da",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        boxShadow: "0 2px 20px rgba(0,0,0,0.06)"
      }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <img src="/house-icon.png" alt="TrọTốt" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <span onClick={() => navigate("/profile")} style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>👋 {user.name}</span>
          ) : (
            <>
              <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #ff6b35", background: "transparent", color: "#ff6b35", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng nhập</button>
              <button onClick={() => navigate("/register")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng ký</button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ display: "flex", maxWidth: 1280, margin: "0 auto", gap: 28, padding: "88px 24px 40px" }}>

        {/* SIDEBAR */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", position: "sticky", top: 80 }}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 16 }}>🔍 Bộ lọc</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tìm kiếm</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên phòng, địa chỉ..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "Nunito" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Tỉnh/Thành phố</label>
              {PROVINCES.map(p => (
                <div key={p} onClick={() => { setProvince(p); setDistrict("Tất cả"); }} style={{
                  padding: "7px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: province === p ? "rgba(255,107,53,0.1)" : "transparent",
                  color: province === p ? "#ff6b35" : "#555",
                }}>{p}</div>
              ))}
            </div>

            {province !== "Tất cả" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Quận/Huyện</label>
                <div onClick={() => setDistrict("Tất cả")} style={{
                  padding: "7px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: district === "Tất cả" ? "rgba(255,107,53,0.1)" : "transparent",
                  color: district === "Tất cả" ? "#ff6b35" : "#555",
                }}>Tất cả</div>
                {(DISTRICTS_BY_PROVINCE[province] || []).map(d => (
                  <div key={d} onClick={() => setDistrict(d)} style={{
                    padding: "7px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: district === d ? "rgba(255,107,53,0.1)" : "transparent",
                    color: district === d ? "#ff6b35" : "#555",
                  }}>{d}</div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Loại phòng</label>
              {TYPES.map(t => (
                <div key={t} onClick={() => setType(t)} style={{
                  padding: "7px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: type === t ? "rgba(255,107,53,0.1)" : "transparent",
                  color: type === t ? "#ff6b35" : "#555",
                }}>{t}</div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Khoảng giá (đ/tháng)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Từ" type="number"
                  style={{ width: "50%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e2da", fontSize: 12, boxSizing: "border-box" }} />
                <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Đến" type="number"
                  style={{ width: "50%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e2da", fontSize: 12, boxSizing: "border-box" }} />
              </div>
            </div>

            <button onClick={() => { setSearch(""); setProvince("Tất cả"); setDistrict("Tất cả"); setType("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* DANH SÁCH PHÒNG */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>
              Tìm thấy <span style={{ color: "#ff6b35" }}>{total}</span> phòng
            </span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer", fontFamily: "Nunito" }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {["grid", "list"].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: "1.5px solid " + (viewMode === mode ? "#ff6b35" : "#e5e2da"),
                  background: viewMode === mode ? "rgba(255,107,53,0.1)" : "#fff",
                  cursor: "pointer", color: viewMode === mode ? "#ff6b35" : "#888", fontWeight: 700
                }}>{mode === "grid" ? "⊞" : "☰"}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#888" }}>⏳ Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: "#888" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Không tìm thấy phòng phù hợp</div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : "1fr",
              gap: 20
            }}>
              {filtered.map(room => (
                <div key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
                  style={{
                    background: "#fff", borderRadius: 20, overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                    transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
                    display: viewMode === "list" ? "flex" : "block",
                  }}>
                  {/* Ảnh */}
                  <div style={{
                    width: viewMode === "list" ? 200 : "100%", height: viewMode === "list" ? 140 : 170,
                    background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                    position: "relative", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
                  }}>
                    {room.images && room.images.length > 0
                      ? <img loading="lazy" src={getImgUrl(room.images[0])} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 44 }}>🏠</span>
                    }
                    <span style={{
                      position: "absolute", top: 10, left: 10,
                      background: room.status === "Còn trống" ? "#2ec4b6" : "#ff4444",
                      color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20
                    }}>{room.status}</span>
                    <button onClick={e => { e.stopPropagation(); toggleWishlist(room.id); }} style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
                      width: 30, height: 30, cursor: "pointer", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {wishlist.includes(room.id) ? "❤️" : "🤍"}
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: 16, flex: 1 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.4 }}>{room.title}</h3>
                    <p style={{ margin: "0 0 10px", color: "#888", fontSize: 12 }}><img src={process.env.PUBLIC_URL + "/location-icon.png"} alt="location" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />{room.address}</p>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {[room.type, `${room.area}m²`, `⭐ ${room.rating}`].map((tag, i) => (
                        <span key={i} style={{ background: "#f8f7f4", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#555" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#ff6b35" }}>{formatPrice(room.price)}</span>
                      <button onClick={e => { e.stopPropagation(); navigate(`/rooms/${room.id}`); }} style={{
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                        color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer"
                      }}>Xem chi tiết</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 32 }}>
              <button onClick={() => { setPage(p => p - 1); fetchRooms(page - 1); }} disabled={page === 1}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#ccc" : "#555" }}>
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { setPage(p); fetchRooms(p); }}
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: "none", fontWeight: 800, cursor: "pointer", fontSize: 14,
                    background: page === p ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "#fff",
                    color: page === p ? "#fff" : "#555",
                    border: page === p ? "none" : "1.5px solid #e5e2da",
                  }}>
                  {p}
                </button>
              ))}

              <button onClick={() => { setPage(p => p + 1); fetchRooms(page + 1); }} disabled={page === totalPages}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", fontWeight: 700, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555" }}>
                Sau →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
