import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";

const INITIAL_MSG = "Xin chào! 👋 Tôi là trợ lý AI của TrọTốt. Tôi có thể giúp bạn tìm phòng hoặc tư vấn giá. Bạn cần hỗ trợ gì?";

export default function ChatBot() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const scrollRef = useRef(null);
  
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("chatHistory");
      return saved ? JSON.parse(saved) : [{ role: "bot", text: INITIAL_MSG }];
    } catch {
      return [{ role: "bot", text: INITIAL_MSG }];
    }
  });

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory, chatTyping]);

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
      setChatHistory(prev => [...prev, { role: "bot", text: "Xin lỗi, trợ lý tạm thời không khả dụng. 🙏" }]);
    } finally {
      setChatTyping(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, fontFamily: "'Nunito', sans-serif" }}>
      {chatOpen && (
        <div style={{ 
          position: "absolute", bottom: 70, right: 0, 
          width: 380, // Đã thu nhỏ từ 500 xuống 380
          background: "#fff", borderRadius: 16, 
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)", overflow: "hidden",
          display: "flex", flexDirection: "column"
        }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #ff6b35, #f7931e)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Trợ lý AI</div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 10 }}>● Đang hoạt động</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setChatHistory([{ role: "bot", text: INITIAL_MSG }])}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", borderRadius: 4, padding: "2px 6px" }}>Xóa</button>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
          </div>

          {/* Chat Body */}
          <div 
            ref={scrollRef}
            style={{ height: 400, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, background: "#fcfcfc" }}
          >
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "8px 12px",
                  borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #ff6b35, #f7931e)" : "#f1f0ec",
                  color: msg.role === "user" ? "#fff" : "#2d2d2d", fontSize: 13, lineHeight: 1.5,
                }}>
                  {msg.text.split("\n").map((line, j) => {
                    const m = line.match(/PHONG:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\/rooms\/\d+)/);
                    if (m) return (
                      <div key={j} style={{ background: "#fff", borderRadius: 8, padding: 8, marginTop: 6, border: "1px solid #eee" }}>
                        <div style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 12 }}>{m[1]}</div>
                        <div style={{ color: "#ff6b35", fontWeight: 700, fontSize: 12 }}>{m[2]}</div>
                        <div style={{ color: "#888", fontSize: 11 }}>{m[3]}</div>
                        <button onClick={() => navigate(m[5])} style={{ marginTop: 6, width: "100%", padding: "4px 0", borderRadius: 4, border: "none", background: "#fff2ed", color: "#ff6b35", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid #ff6b35" }}>Xem chi tiết</button>
                      </div>
                    );
                    return <span key={j}>{line}<br /></span>;
                  })}
                </div>
              </div>
            ))}
            {chatTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#f1f0ec", borderRadius: "14px 14px 14px 2px", padding: "8px 12px", fontSize: 12, color: "#888" }}>AI đang soạn tin...</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #eee", display: "flex", gap: 6, background: "#fff" }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Nhập tin nhắn..."
              style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: "1px solid #ddd", fontSize: 13, outline: "none" }} />
            <button onClick={sendChat} disabled={chatTyping}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: chatTyping ? "#ccc" : "#ff6b35", color: "#fff", cursor: chatTyping ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button onClick={() => setChatOpen(v => !v)}
        style={{ width: 50, height: 50, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontSize: 20, cursor: "pointer", boxShadow: "0 4px 15px rgba(255,107,53,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {chatOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}