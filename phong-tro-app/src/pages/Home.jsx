import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getImgUrl } from "../utils/getImgUrl";

const PROVINCES = ["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bắc Ninh"];
const DISTRICTS_BY_PROVINCE = {
  "TP. Hồ Chí Minh": ["Quận 1","Quận 2","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 9","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Tân Bình","Tân Phú","Thủ Đức","Bình Chánh","Hóc Môn","Nhà Bè"],
  "Hà Nội": ["Ba Đình","Hoàn Kiếm","Đống Đa","Hai Bà Trưng","Hoàng Mai","Thanh Xuân","Cầu Giấy","Nam Từ Liêm","Bắc Từ Liêm","Tây Hồ","Long Biên","Hà Đông"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Sơn Trà","Ngũ Hành Sơn","Liên Chiểu","Cẩm Lệ","Hòa Vang"],
  "Bắc Ninh": ["Thành phố Bắc Ninh","Từ Sơn","Tiên Du","Yên Phong","Quế Võ","Lương Tài","Gia Bình"],
};
const TYPES = ["Tất cả", "Phòng trọ", "Studio", "Mini Apartment", "Căn hộ", "KTX"];
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
const amenityIcons = {
  "Điều hòa": "❄️", WiFi: "📶", Bếp: "🍳", "Ban công": "🌿",
  "Máy giặt": "🌀", "WC riêng": "🚿", "Tủ lạnh": "🧊", "Bảo vệ 24/7": "🔒",
};

function formatPrice(p) {
  return p >= 1000000
    ? (p / 1000000).toFixed(1).replace(".0", "") + " triệu/tháng"
    : p.toLocaleString() + "đ/tháng";
}

export default function Home() {
  const navigate = useNavigate();
  const roomsRef = useRef(null);
  const LIMIT = 9;

  const [user, setUser] = useState(null);
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

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("chatHistory");
      return saved ? JSON.parse(saved) : [{ role: "bot", text: "Xin chào! 👋 Tôi là trợ lý AI của TrọTốt. Tôi có thể giúp bạn tìm phòng, tư vấn giá cả hoặc hướng dẫn sử dụng app. Bạn cần hỗ trợ gì?" }];
    } catch { return [{ role: "bot", text: "Xin chào! 👋 Tôi là trợ lý AI của TrọTốt. Bạn cần hỗ trợ gì?" }]; }
  });

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  useEffect(() => {
    fetchRooms(1);
    const token = localStorage.getItem("token");
    if (token) fetchWishlist(token);
  }, []);

  useEffect(() => {
    fetchRooms(1);
    setPage(1);
  }, [search, province, district, type, minPrice, maxPrice, sort]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (!token || !savedUser) return;
    let u;
    try { u = JSON.parse(savedUser); } catch { return; }
    const fetchUnread = () => {
      axios.get(`${process.env.REACT_APP_API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const total = (res.data || []).reduce((sum, conv) => {
          const count = conv.unreadCount?.[u.id] ?? conv.unreadCount?.[String(u.id)] ?? 0;
          return sum + count;
        }, 0);
        setUnreadMsgCount(total);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async (p = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search) params.append("search", search);
      if (district !== "Tất cả") {
        params.append("district", district);
      } else if (province !== "Tất cả") {
        const districts = DISTRICTS_BY_PROVINCE[province] || [];
        params.append("districts", districts.join(","));
      }
      if (type !== "Tất cả") params.append("type", type);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms?${params}`);
      if (res.data.rooms) {
        setRooms(res.data.rooms);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch { setRooms([]); } finally { setLoading(false); }
  };

  const fetchWishlist = async (token) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistItems(res.data.wishlist || []);
    } catch {}
  };

  const toggleWishlist = async (id) => {
    if (!user) return navigate("/login");
    const token = localStorage.getItem("token");
    const roomObj = rooms.find(r => r.id === id);
    const isIn = wishlistItems.some(r => r.id === id);
    setWishlistItems(prev => isIn ? prev.filter(r => r.id !== id) : (roomObj ? [...prev, roomObj] : prev));
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/wishlist/toggle`,
        { roomId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlistItems(res.data.wishlist || []);
    } catch {
      setWishlistItems(prev => isIn ? (roomObj ? [...prev, roomObj] : prev) : prev.filter(r => r.id !== id));
    }
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || chatTyping) return;
    const userMsg = chatMsg.trim();
    const newHistory = [...chatHistory, { role: "user", text: userMsg }];
    setChatHistory(newHistory);
    setChatMsg("");
    setChatTyping(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/chat`, {
        messages: newHistory.map(m => ({ role: m.role === "user" ? "user" : "bot", text: m.text })),
      });
      setChatHistory(prev => [...prev, { role: "bot", text: res.data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "bot", text: "Xin lỗi, trợ lý tạm thời không khả dụng. Vui lòng thử lại sau! 🙏" }]);
    } finally {
      setChatTyping(false);
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ff6b35, #f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
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
                          ? <img src={getImgUrl(room.images[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
              <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); }}
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
          <div style={{ width: 268, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1.5px solid #e8e4dd", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", position: "sticky", top: 80 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#1a1a1a" }}>Bộ lọc</h3>
                <button onClick={() => { setSearch(""); setProvince("Tất cả"); setDistrict("Tất cả"); setType("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
                  style={{ fontSize: 12, color: "#ff6b35", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "Nunito" }}>
                  Xóa tất cả
                </button>
              </div>

              {/* Tìm kiếm */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>Tìm kiếm</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên phòng, địa chỉ..."
                    style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "Nunito" }} />
                </div>
              </div>

              {/* Tỉnh/TP */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Tỉnh/Thành phố</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {PROVINCES.map(p => (
                    <div key={p} onClick={() => { setProvince(p); setDistrict("Tất cả"); }}
                      style={{ padding: "7px 12px", borderRadius: 8, marginBottom: 1, cursor: "pointer", fontSize: 13, fontWeight: 600, background: province === p ? "rgba(255,107,53,0.1)" : "transparent", color: province === p ? "#ff6b35" : "#555" }}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quận/Huyện */}
              {province !== "Tất cả" && (
                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Quận/Huyện</label>
                  <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                    {["Tất cả", ...(DISTRICTS_BY_PROVINCE[province] || [])].map(d => (
                      <div key={d} onClick={() => setDistrict(d)}
                        style={{ padding: "7px 12px", borderRadius: 8, marginBottom: 1, cursor: "pointer", fontSize: 13, fontWeight: 600, background: district === d ? "rgba(255,107,53,0.1)" : "transparent", color: district === d ? "#ff6b35" : "#555" }}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loại phòng */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Loại phòng</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {TYPES.map(t => (
                    <div key={t} onClick={() => setType(t)}
                      style={{ padding: "7px 12px", borderRadius: 8, marginBottom: 1, cursor: "pointer", fontSize: 13, fontWeight: 600, background: type === t ? "rgba(255,107,53,0.1)" : "transparent", color: type === t ? "#ff6b35" : "#555" }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Giá tối đa - Slider */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Giá tối đa</label>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#aaa" }}>0đ</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#ff6b35" }}>
                    {maxPrice ? `${(Number(maxPrice) / 1000000).toFixed(0)} triệu/tháng` : "Không giới hạn"}
                  </span>
                </div>
                <input type="range" min={0} max={50000000} step={500000}
                  value={maxPrice || 50000000}
                  onChange={e => setMaxPrice(e.target.value === "50000000" ? "" : e.target.value)}
                  className="price-slider"
                  style={{ "--val": `${((maxPrice || 50000000) / 50000000) * 100}%` }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#bbb" }}>0</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>50 triệu</span>
                </div>
              </div>
            </div>
          </div>

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
                  <div key={room.id}
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
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
                    }}>
                      {room.images && room.images.length > 0
                        ? <img src={getImgUrl(room.images[0])} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 44 }}>🏠</span>}
                      <span style={{ position: "absolute", top: 10, left: 10, background: room.status === "Còn trống" ? "#2ec4b6" : "#ff4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{room.status}</span>
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(room.id); }} style={{
                        position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
                        width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {wishlistItems.some(r => r.id === room.id) ? "❤️" : "🤍"}
                      </button>
                    </div>
                    <div style={{ padding: 16, flex: 1 }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.4 }}>{room.title}</h3>
                      <p style={{ margin: "0 0 8px", color: "#888", fontSize: 12 }}>📍 {room.address}</p>
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
                          color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer"
                        }}>Xem chi tiết</button>
                      </div>
                    </div>
                  </div>
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
              { step: "03", icon: "🤝", title: "Ký hợp đồng", desc: "Ký hợp đồng điện tử, chuyển cọc an toàn qua hệ thống" },
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
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999 }}>
        {chatOpen && (
          <div style={{ position: "absolute", bottom: 70, right: 0, width: 500, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #ff6b35, #f7931e)", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Trợ lý AI</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>● Đang hoạt động</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setChatHistory([{ role: "bot", text: "Xin chào! 👋 Tôi là trợ lý AI của TrọTốt. Bạn cần hỗ trợ gì?" }])}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", borderRadius: 6, padding: "4px 8px" }}>Xóa</button>
                <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ height: 500, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "#f8f7f4",
                    color: msg.role === "user" ? "#fff" : "#1a1a1a", fontSize: 13, lineHeight: 1.6,
                  }}>
                    {msg.text.split("\n").map((line, j) => {
                      const m = line.match(/PHONG:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\/rooms\/\d+)/);
                      if (m) return (
                        <div key={j} style={{ background: "#fff", borderRadius: 10, padding: 10, marginTop: 6, border: "1px solid #e5e2da" }}>
                          <div style={{ fontWeight: 800, color: "#1a1a1a", fontSize: 13 }}>{m[1]}</div>
                          <div style={{ color: "#ff6b35", fontWeight: 700, fontSize: 13 }}>{m[2]}</div>
                          <div style={{ color: "#888", fontSize: 12 }}>{m[3]} • {m[4]}</div>
                          <button onClick={() => navigate(m[5])} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Xem chi tiết →</button>
                        </div>
                      );
                      return <span key={j}>{line}<br /></span>;
                    })}
                  </div>
                </div>
              ))}
              {chatTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#f8f7f4", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13, color: "#888" }}>⏳ Đang trả lời...</div>
                </div>
              )}
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f0ede8", display: "flex", gap: 8 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Hỏi tôi về phòng trọ..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, outline: "none", fontFamily: "Nunito" }} />
              <button onClick={sendChat} disabled={chatTyping}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: chatTyping ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, cursor: chatTyping ? "not-allowed" : "pointer", fontSize: 13 }}>
                Gửi
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(v => !v)}
          style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(255,107,53,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          💬
        </button>
      </div>
    </div>
  );
}
