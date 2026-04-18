import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";

const INITIAL_MSG = "Xin chào! 👋 Tôi là trợ lý AI của TrọTốt. Tôi có thể giúp bạn tìm phòng, tư vấn giá cả hoặc hướng dẫn sử dụng app. Bạn cần hỗ trợ gì?";

export default function ChatBot() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("chatHistory");
      return saved ? JSON.parse(saved) : [{ role: "bot", text: INITIAL_MSG }];
    } catch {
      return [{ role: "bot", text: INITIAL_MSG }];
    }
  });

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const sendChat = async () => {
    if (!chatMsg.trim() || chatTyping) return;
    const userMsg = chatMsg.trim();
    const newHistory = [...chatHistory, { role: "user", text: userMsg }];
    setChatHistory(newHistory);
    setChatMsg("");
    setChatTyping(true);
    try {
      const res = await api.post("/api/chat", {
        messages: newHistory.map(m => ({ role: m.role === "user" ? "user" : "bot", text: m.text })),
      });
      setChatHistory(prev => [...prev, { role: "bot", text: res.data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "bot", text: "Xin lỗi, trợ lý tạm thời không khả dụng. Vui lòng thử lại sau! 🙏" }]);
    } finally {
      setChatTyping(false);
    }
  };

  return (
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
              <button onClick={() => setChatHistory([{ role: "bot", text: INITIAL_MSG }])}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", borderRadius: 6, padding: "4px 8px" }}>Xóa</button>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
          </div>

          <div style={{ height: 500, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
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
  );
}