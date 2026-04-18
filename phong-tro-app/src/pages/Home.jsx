import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getImgUrl } from "../utils/getImgUrl";
import { PROVINCES_FILTER, DISTRICTS_BY_PROVINCE, ROOM_TYPES_FILTER } from "../constants";
import ChatBot from "../components/ChatBot";
import RoomCard from "../components/RoomCard";
import FilterSidebar from "../components/FilterSidebar";

const PROVINCES = PROVINCES_FILTER;
const TYPES = ROOM_TYPES_FILTER;
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp → cao", value: "price_asc" },
  { label: "Giá cao → thấp", value: "price_desc" },
];
const stats = [
  { value: "2,500+", label: "Phòng trọ", icon: "🏠" },
  { value: "1,200+", label: "Chủ nhà", icon: "👤" },
  { value: "8,000+", label: "Khách thuê", icon: "🤝" },
  { value: "98%", label: "Hài lòng", icon: "⭐" },
];

function formatPrice(p) {
  return p >= 1000000
    ? (p / 1000000).toFixed(1).replace(".0", "") + " triệu/tháng"
    : p.toLocaleString() + "đ/tháng";
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const roomsRef = useRef(null);
  const LIMIT = 9;
  const [heroLoaded, setHeroLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("Tất cả");
  const [district, setDistrict] = useState("Tất cả");
  const [type, setType] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  useEffect(() => {
    fetchRooms(1);
    if (user) fetchWishlist();
  }, []);

  useEffect(() => {
    fetchRooms(1);
    setPage(1);
  }, [search, province, district, type, minPrice, maxPrice, sort]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api.get("/api/messages/conversations").then(res => {
        const total = (res.data || []).reduce((sum, conv) => {
          const count = conv.unreadCount?.[user.id] ?? conv.unreadCount?.[String(user.id)] ?? 0;
          return sum + count;
        }, 0);
        setUnreadMsgCount(total);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchRooms = async (p = 1) => {
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
      const res = await api.get(`/api/rooms?${params}`);
      if (res.data.rooms) {
        setRooms(res.data.rooms);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch { setRooms([]); } finally { setLoading(false); }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/api/wishlist');
      setWishlistItems(res.data.wishlist || []);
    } catch {}
  };

  const toggleWishlist = async (id) => {
    if (!user) return navigate("/login");
    const roomObj = rooms.find(r => r.id === id);
    const isIn = wishlistItems.some(r => r.id === id);
    setWishlistItems(prev => isIn ? prev.filter(r => r.id !== id) : (roomObj ? [...prev, roomObj] : prev));
    try {
      const res = await api.post('/api/wishlist/toggle', { roomId: id });
      setWishlistItems(res.data.wishlist || []);
    } catch {
      setWishlistItems(prev => isIn ? (roomObj ? [...prev, roomObj] : prev) : prev.filter(r => r.id !== id));
    }
  };

  const handleHeroSearch = () => {
    roomsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filtered = sort === "newest" ? rooms : [...rooms].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0;
  });

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#f8f7f4", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
      <style>{`
        .price-slider { -webkit-appearance: none; width: 100%; height: 5px; border-radius: 4px; background: linear-gradient(to right, #ff6b35 0%, #ff6b35 var(--val, 50%), #e5e2da var(--val, 50%), #e5e2da 100%); outline: none; cursor: pointer; }
        .price-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #ff6b35; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(255,107,53,0.4); cursor: pointer; }
        .price-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #ff6b35; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(255,107,53,0.4); cursor: pointer; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e5e2da",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/house-icon.png" alt="TrọTốt" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>TrọTốt</span>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
            onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>Trang chủ</a>
          <a href="#" onClick={e => { e.preventDefault(); roomsRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
            onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>Tìm phòng</a>
          {user && (
            <a href="#" onClick={e => { e.preventDefault(); navigate("/messages"); }}
              style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = "#ff6b35"} onMouseLeave={e => e.currentTarget.style.color = "#555"}>
              Tin nhắn
              {unreadMsgCount > 0 && (
                <span style={{ background: "#ff6b35", color: "#fff", borderRadius: "50%", minWidth: 18, height: 18, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unreadMsgCount > 99 ? "99+" : unreadMsgCount}
                </span>
              )}
            </a>
          )}
          {user && (
            <a href="#" onClick={e => { e.preventDefault(); navigate("/my-bookings"); }}
              style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
              onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>Lịch hẹn</a>
          )}
          {user && user.role === "tenant" && (
            <a href="#" onClick={e => { e.preventDefault(); navigate("/my-contracts"); }}
              style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
              onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>Lịch sử thuê</a>
          )}
          {user && (
            <div style={{ position: "relative" }}>
              <a href="#" onClick={e => { e.preventDefault(); setShowWishlist(v => !v); }}
                style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}
                onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>
                Yêu thích
                {wishlistItems.length > 0 && (
                  <span style={{ background: "#ff6b35", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {wishlistItems.length}
                  </span>
                )}
              </a>
              {showWishlist && (
                <div style={{ position: "absolute", top: 32, left: 0, zIndex: 200, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", minWidth: 300, maxHeight: 400, overflowY: "auto" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: "#1a1a1a" }}>❤️ Phòng yêu thích</div>
                  {wishlistItems.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 13 }}>Chưa có phòng yêu thích</div>
                  ) : wishlistItems.map(room => (
                    <div key={room.id} onClick={() => { navigate(`/rooms/${room.id}`); setShowWishlist(false); }}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 8px", borderRadius: 10, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8f7f4"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 52, height: 44, borderRadius: 8, overflow: "hidden", background: "linear-gradient(135deg,#ff6b35,#f7931e)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {room.images && room.images.length > 0
                          ? <img loading="lazy" src={getImgUrl(room.images[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 20 }}>🏠</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.title}</div>
                        <div style={{ fontSize: 12, color: "#ff6b35", fontWeight: 700 }}>{formatPrice(room.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <a href="#" onClick={e => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
            style={{ color: "#555", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
            onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#555"}>Hướng dẫn</a>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span onClick={() => navigate("/profile")} style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                👋 Xin chào, {user.name}!
              </span>
              <button onClick={() => { logout(); }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #ff6b35", background: "transparent", color: "#ff6b35", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng nhập</button>
              <button onClick={() => navigate("/register")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(255,107,53,0.3)" }}>Đăng ký</button>
              <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #2ec4b6, #1aab9e)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(46,196,182,0.3)" }}>Đăng tin</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        marginTop: 64, minHeight: "88vh",
        backgroundImage: "url('/pexels-kelly-2833657.jpg')",
        backgroundSize: "cover", backgroundPosition: "center",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.62)", pointerEvents: "none" }} />
        <div style={{
          textAlign: "center", padding: "60px 20px 40px", maxWidth: 800,
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ display: "inline-block", background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 30, padding: "6px 18px", marginBottom: 24, color: "#ff6b35", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
            🔥 HƠN 2,500 PHÒNG TRỌ ĐANG CHỜ BẠN
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, color: "#ffffff", lineHeight: 1.15, marginBottom: 20 }}>
            Tìm Phòng Trọ<br /><span style={{ color: "#ff6b35" }}>Ưng Ý Nhất</span> Của Bạn
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            Kết nối trực tiếp với chủ nhà — không qua trung gian, không phí môi giới.
          </p>

          {/* HERO SEARCH BOX */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", maxWidth: 820, margin: "0 auto" }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 6 }}>TÌM KIẾM</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập tên phòng, địa chỉ..."
                style={{ width: "100%", border: "1.5px solid #e5e2da", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 6 }}>TỈNH/THÀNH PHỐ</label>
              <select value={province} onChange={e => { setProvince(e.target.value); setDistrict("Tất cả"); }}
                style={{ width: "100%", border: "1.5px solid #e5e2da", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 6 }}>LOẠI PHÒNG</label>
              <select value={type} onChange={e => setType(e.target.value)}
                style={{ width: "100%", border: "1.5px solid #e5e2da", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 6 }}>GIÁ THUÊ</label>
              <select onChange={e => {
                const v = e.target.value;
                if (!v) { setMinPrice(""); setMaxPrice(""); }
                else { const [mn, mx] = v.split("-"); setMinPrice(mn); setMaxPrice(mx); }
              }} style={{ width: "100%", border: "1.5px solid #e5e2da", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
                <option value="">Tất cả</option>
                <option value="0-2000000">Dưới 2 triệu</option>
                <option value="2000000-4000000">2 - 4 triệu</option>
                <option value="4000000-6000000">4 - 6 triệu</option>
                <option value="6000000-99999999">Trên 6 triệu</option>
              </select>
            </div>
            <button onClick={handleHeroSearch}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(255,107,53,0.4)", whiteSpace: "nowrap" }}>
              🔍 Tìm phòng
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#fff", padding: "48px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "24px 16px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#ff6b35" }}>{s.value}</div>
              <div style={{ color: "#888", fontWeight: 600, fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROOM LIST SECTION */}
      <section ref={roomsRef} style={{ padding: "64px 24px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: "#ff6b35", fontWeight: 700, fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>PHÒNG TRỌ</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Tất Cả Phòng Trọ</h2>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          {/* SIDEBAR */}
          <FilterSidebar
            search={search} setSearch={setSearch}
            province={province} setProvince={setProvince}
            district={district} setDistrict={setDistrict}
            type={type} setType={setType}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            onReset={() => { setSearch(""); setProvince("Tất cả"); setDistrict("Tất cả"); setType("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
          />

          {/* ROOM GRID */}
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
              <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : "1fr", gap: 20 }}>
                {filtered.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    viewMode={viewMode}
                    isWishlisted={wishlistItems.some(r => r.id === room.id)}
                    onWishlistToggle={toggleWishlist}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 32 }}>
                <button onClick={() => { const p = page - 1; setPage(p); fetchRooms(p); }} disabled={page === 1}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#ccc" : "#555" }}>
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => { setPage(p); fetchRooms(p); }}
                    style={{ width: 38, height: 38, borderRadius: 10, border: page === p ? "none" : "1.5px solid #e5e2da", fontWeight: 800, cursor: "pointer", fontSize: 14, background: page === p ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "#fff", color: page === p ? "#fff" : "#555" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => { const p = page + 1; setPage(p); fetchRooms(p); }} disabled={page === totalPages}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e2da", background: "#fff", fontWeight: 700, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555" }}>
                  Sau →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "#fff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#ff6b35", fontWeight: 700, fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>QUY TRÌNH</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#1a1a1a", marginBottom: 56 }}>Thuê Phòng Chỉ 3 Bước</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
            {[
              { step: "01", icon: "🔍", title: "Tìm kiếm", desc: "Lọc theo khu vực, giá, tiện nghi để tìm phòng phù hợp" },
              { step: "02", icon: "📅", title: "Đặt lịch", desc: "Đặt lịch xem phòng trực tuyến, gặp chủ nhà trực tiếp" },
              { step: "03", icon: "🤝", title: "Ký hợp đồng", desc: "Ký hợp đồng thuê phòng, theo dõi và quản lý hợp đồng trực tiếp trên hệ thống" },
            ].map(item => (
              <div key={item.step} style={{ padding: "32px 24px", borderRadius: 20, background: "#f8f7f4", position: "relative" }}>
                <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900 }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 40, marginBottom: 16, marginTop: 8 }}>{item.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: "#1a1a1a" }}>{item.title}</h3>
                <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #ff6b35, #f7931e)", padding: "72px 40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>Bạn là chủ nhà? Đăng phòng miễn phí!</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 36 }}>Tiếp cận hàng nghìn khách thuê tiềm năng — nhanh chóng, dễ dàng, không phí ẩn</p>
        <button onClick={() => navigate("/register")}
          style={{ padding: "14px 40px", borderRadius: 12, border: "2px solid #fff", background: "#fff", color: "#ff6b35", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          🏠 Đăng phòng ngay — Miễn phí
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a2e", color: "#94a3b8", padding: "48px 40px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>🏠</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#fff" }}>TrọTốt</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>Nền tảng tìm kiếm và quản lý phòng trọ trực tuyến hàng đầu Việt Nam.</p>
          </div>
          {[
            { title: "Dịch vụ", links: ["Tìm phòng", "Đăng phòng", "Đặt lịch xem", "Ký hợp đồng"] },
            { title: "Hỗ trợ", links: ["Trung tâm hỗ trợ", "Liên hệ", "Chính sách", "Điều khoản"] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ color: "#fff", fontWeight: 800, marginBottom: 16, fontSize: 14 }}>{col.title}</h4>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: "block", color: "#94a3b8", textDecoration: "none", fontSize: 13, marginBottom: 8 }}
                  onMouseEnter={e => e.target.style.color = "#ff6b35"} onMouseLeave={e => e.target.style.color = "#94a3b8"}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, textAlign: "center", fontSize: 13 }}>
          © 2026 TrọTốt. Created by Đào Mạnh Cường — Đồ án tốt nghiệp
        </div>
      </footer>

      {/* AI CHATBOT */}
      <ChatBot />
    </div>
  );
}
