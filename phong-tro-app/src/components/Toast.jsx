import { useState, useEffect } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return { toasts, toast };
}

const COLORS = {
  success: { bg: "#2ec4b6", icon: "✅" },
  error:   { bg: "#ff4444", icon: "⚠️" },
  info:    { bg: "#4361ee", icon: "ℹ️" },
};

export default function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: COLORS[t.type]?.bg || "#333",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "slideIn 0.3s ease",
          maxWidth: 320,
        }}>
          <span>{COLORS[t.type]?.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
