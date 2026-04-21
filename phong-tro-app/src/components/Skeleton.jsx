const pulse = `
  @keyframes skeleton-pulse {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
`;

function SkeletonBox({ width = "100%", height = 16, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, #f0ede8 25%, #e8e4de 50%, #f0ede8 75%)",
      backgroundSize: "200px 100%",
      animation: "skeleton-pulse 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard() {
  return (
    <>
      <style>{pulse}</style>
      <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <SkeletonBox height={180} borderRadius={0} />
        <div style={{ padding: "16px 18px" }}>
          <SkeletonBox height={14} width="80%" style={{ marginBottom: 10 }} />
          <SkeletonBox height={12} width="60%" style={{ marginBottom: 10 }} />
          <SkeletonBox height={18} width="40%" style={{ marginBottom: 12 }} />
          <SkeletonBox height={12} width="50%" />
        </div>
      </div>
    </>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <>
      <style>{pulse}</style>
      <tr>
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} style={{ padding: "14px 16px" }}>
            <SkeletonBox height={13} width={i === 0 ? "80%" : "60%"} />
            {i === 0 && <SkeletonBox height={11} width="50%" style={{ marginTop: 6 }} />}
          </td>
        ))}
      </tr>
    </>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "20px 0 4px" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{
        padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e2da",
        background: page === 1 ? "#f8f7f4" : "#fff", color: page === 1 ? "#ccc" : "#555",
        fontWeight: 700, fontSize: 13, cursor: page === 1 ? "default" : "pointer"
      }}>←</button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: "7px 12px", borderRadius: 8, border: "none",
          background: p === page ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
          color: p === page ? "#fff" : "#555",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>{p}</button>
      ))}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{
        padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e2da",
        background: page === totalPages ? "#f8f7f4" : "#fff", color: page === totalPages ? "#ccc" : "#555",
        fontWeight: 700, fontSize: 13, cursor: page === totalPages ? "default" : "pointer"
      }}>→</button>

    </div>
  );
}

export default SkeletonBox;
