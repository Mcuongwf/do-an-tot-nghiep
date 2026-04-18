import { PROVINCES_FILTER, DISTRICTS_BY_PROVINCE, ROOM_TYPES_FILTER } from "../constants";

const PROVINCES = PROVINCES_FILTER;
const TYPES = ROOM_TYPES_FILTER;

export default function FilterSidebar({ search, setSearch, province, setProvince, district, setDistrict, type, setType, maxPrice, setMaxPrice, onReset }) {
  return (
    <div style={{ width: 268, flexShrink: 0 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1.5px solid #e8e4dd", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", position: "sticky", top: 80 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#1a1a1a" }}>Bộ lọc</h3>
          <button onClick={onReset}
            style={{ fontSize: 12, color: "#ff6b35", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "Nunito" }}>
            Xóa tất cả
          </button>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: "#888", display: "block", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>Tìm kiếm</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên phòng, địa chỉ..."
              style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: "1.5px solid #e5e2da", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "Nunito" }} />
          </div>
        </div>

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
  );
}