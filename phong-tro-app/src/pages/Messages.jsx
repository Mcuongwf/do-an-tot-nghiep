import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { io as socketIO } from "socket.io-client";
import ToastContainer, { useToast } from "../components/Toast";
import LandlordSidebar from "../components/LandlordSidebar";
import { getImgUrl } from "../utils/getImgUrl";

const API = process.env.REACT_APP_API_URL;

const QUICK_REPLIES = [
  "Phòng này còn cho thuê không ạ?",
  "Có video không ạ?",
  "Có nấu ăn trong phòng được không ạ?",
  "Phòng ở được mấy người ạ?",
  "Thời gian thuê tối thiểu là bao lâu?",
  "Thời gian thuê tối đa là bao lâu?",
  "Giá thuê đã bao gồm điện nước chưa ạ?",
  "Có chỗ để xe không ạ?",
  "Có thể xem phòng trực tiếp không ạ?",
];

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, toast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeConvRef = useRef(null);

  // Sync activeConv vào ref để dùng trong socket callback
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    // Kết nối socket
    const socket = socketIO(API, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 5000,
    });
    socketRef.current = socket;
    const myId = user._id || user.id;
    socket.on("connect", () => socket.emit("join", myId));
    socket.on("connect_error", () => {});

    // Nhận tin nhắn realtime
    socket.on("new_message", (msg) => {
      const currentConv = activeConvRef.current;
      if (currentConv && String(msg.conversationId) === String(currentConv.id)) {
        setMessages(prev => {
          // Tránh duplicate nếu chính mình gửi
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Cập nhật lastMessage trong danh sách hội thoại
      setConversations(prev => prev.map(c =>
        String(c.id) === String(msg.conversationId)
          ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : c
      ));
    });

    fetchConversations().then(() => {
      const withUser = searchParams.get("with");
      const roomId = searchParams.get("room");
      if (withUser) openOrCreateConversation(withUser, roomId);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/api/messages/conversations`, { headers });
      setConversations(res.data);
    } catch {}
    finally { setLoadingConvs(false); }
  };

  const openOrCreateConversation = async (userId, roomId) => {
    try {
      const res = await axios.post(`${API}/api/messages/conversations`, { userId, roomId }, { headers });
      setActiveConv(res.data);
      fetchMessages(res.data.id);
      fetchConversations();
    } catch { toast("Không thể mở hội thoại!", "error"); }
  };

  const selectConversation = (conv) => {
    setActiveConv(conv);
    fetchMessages(conv.id);
  };

  const fetchMessages = async (convId, showLoading = true) => {
    if (showLoading) setLoadingMsgs(true);
    try {
      const res = await axios.get(`${API}/api/messages/conversations/${convId}/messages`, { headers });
      setMessages(res.data);
    } catch {}
    finally { if (showLoading) setLoadingMsgs(false); }
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API}/api/messages/conversations/${activeConv.id}/messages`,
        { content }, { headers }
      );
      setMessages(prev => [...prev, res.data]);
      setInput("");
    } catch { toast("Gửi thất bại!", "error"); }
    finally { setSending(false); }
  };

  const getOther = (conv) => conv.participants?.find(p => String(p.id) !== String(user._id));

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const diff = Date.now() - d;
    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (diff < 86400000 * 2) return "Hôm qua";
    if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} ngày trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const other = activeConv ? getOther(activeConv) : null;

  const Avatar = ({ name, role, size = 40 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: role === "landlord" ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "linear-gradient(135deg,#4361ee,#2ec4b6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.38,
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );

  const filteredConvs = conversations.filter(conv => {
    if (search.length >= 3) {
      const o = getOther(conv);
      const name = o?.name?.toLowerCase() || "";
      const room = conv.room?.title?.toLowerCase() || "";
      if (!name.includes(search.toLowerCase()) && !room.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const isLandlord = user.role === "landlord" || user.role === "admin";
  const chatContent = (
    <>
      <ToastContainer toasts={toasts} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>

      {/* NAVBAR cho tenant */}
      {!isLandlord && (
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e5e2da",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: 60,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          fontFamily: "'Nunito', sans-serif",
        }}>
          <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#ff6b35,#f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏠</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#1a1a1a" }}>TrọTốt</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e2da", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← Trang chủ</button>
            <span style={{ background: "rgba(255,107,53,0.1)", color: "#ff6b35", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{user.name}</span>
          </div>
        </nav>
      )}

      <div style={{ flex: 1, display: "flex", fontFamily: "'Nunito', sans-serif", background: "#f0f2f5", overflow: "hidden", height: isLandlord ? "100%" : "100vh", paddingTop: isLandlord ? 0 : 60 }}>

        {/* SIDEBAR */}
        <div style={{ width: 360, background: "#fff", display: "flex", flexDirection: "column", borderRight: "1px solid #e8e8e8", flexShrink: 0 }}>
          {/* Sidebar Header */}
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#ff6b35,#f7931e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🏠</div>
                <span style={{ fontWeight: 900, fontSize: 20, color: "#1a1a1a" }}>Chat</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#555", padding: "6px 8px", borderRadius: 8 }}>⋯</button>
              </div>
            </div>

          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingConvs ? (
              <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>Đang tải...</div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#aaa" }}>Chưa có tin nhắn nào</div>
                <div style={{ fontSize: 12, marginTop: 4, color: "#ccc" }}>Nhắn tin từ trang chi tiết phòng</div>
              </div>
            ) : filteredConvs.map(conv => {
              const o = getOther(conv);
              const isActive = activeConv?.id === conv.id;
return (
                <div key={conv.id} onClick={() => selectConversation(conv)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                  cursor: "pointer", background: isActive ? "#fff7ed" : "transparent",
                  borderLeft: `3px solid ${isActive ? "#ff6b35" : "transparent"}`,
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar name={o?.name} role={o?.role} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{o?.name || "?"}</span>
                      <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    {conv.room?.title && (
                      <div style={{ fontSize: 12, color: "#ff6b35", fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.room.title}</div>
                    )}
                    <div style={{ fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ccc", gap: 12, background: "#f8f7f4" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>💬</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#aaa" }}>Chọn một cuộc trò chuyện</div>
              <div style={{ fontSize: 13, color: "#ccc" }}>hoặc nhắn tin từ trang chi tiết phòng</div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <Avatar name={other?.name} role={other?.role} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{other?.name}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {other?.role === "landlord" ? "Chủ nhà" : "Khách thuê"}
                    {activeConv.lastMessageAt && ` · Hoạt động ${formatTime(activeConv.lastMessageAt)}`}
                  </div>
                </div>
              </div>

              {/* Room info card */}
              {activeConv.room?.title && (
                <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "12px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8f7f4", borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}
                    onClick={() => activeConv.room?.id && navigate(`/rooms/${activeConv.room.id}`)}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "linear-gradient(135deg,#ff6b35,#f7931e)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {activeConv.room?.images?.[0]
                        ? <img src={getImgUrl(activeConv.room.images[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 18 }}>🏠</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeConv.room.title}</div>
                      {activeConv.room?.price && (
                        <div style={{ fontSize: 12, color: "#ff6b35", fontWeight: 700 }}>
                          {(activeConv.room.price / 1000000).toFixed(1).replace(".0", "")} triệu/tháng
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#bbb" }}>›</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 6, background: "#f8f7f4" }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Hãy gửi tin nhắn đầu tiên!</div>
                  </div>
                ) : messages.map((msg, i) => {
                  const isMe = String(msg.sender?.id || msg.sender?._id || msg.sender) === String(user._id);
                  const showDate = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
                          <span style={{ background: "#e8e8e8", color: "#999", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>
                            {new Date(msg.createdAt).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                        {!isMe && <Avatar name={msg.sender?.name} role={other?.role} size={26} />}
                        <div style={{ maxWidth: "60%" }}>
                          <div style={{
                            padding: "10px 14px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
                            color: isMe ? "#fff" : "#1a1a1a",
                            fontSize: 14, lineHeight: 1.5,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            wordBreak: "break-word",
                          }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 3, textAlign: isMe ? "right" : "left", paddingInline: 4 }}>
                            {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {isMe && <span style={{ marginLeft: 4 }}>✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies - chỉ hiện cho tenant */}
              {user.role === "tenant" && (
                <div style={{ background: "#fff", borderTop: "1px solid #eee", padding: "10px 24px", overflowX: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
                  {QUICK_REPLIES.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)} style={{
                      padding: "7px 14px", borderRadius: 20, border: "1.5px solid #e5e2da",
                      background: "#fff", color: "#555", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b35"; e.currentTarget.style.color = "#ff6b35"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e2da"; e.currentTarget.style.color = "#555"; }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ background: "#fff", borderTop: "1px solid #eee", padding: "14px 24px" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  style={{
                    width: "100%", padding: "12px 0", border: "none", borderBottom: "1.5px solid #eee",
                    fontSize: 14, fontFamily: "Nunito", resize: "none", background: "transparent",
                    maxHeight: 80, lineHeight: 1.5, color: "#333", marginBottom: 10,
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => sendMessage()} disabled={!input.trim() || sending} style={{
                    padding: "8px 20px", borderRadius: 10, border: "none",
                    background: input.trim() ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#e5e2da",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: input.trim() ? "pointer" : "default",
                    transition: "all 0.2s",
                    boxShadow: input.trim() ? "0 4px 12px rgba(255,107,53,0.3)" : "none",
                  }}>
                    {sending ? "Đang gửi..." : "Gửi ➤"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  return isLandlord ? <LandlordSidebar>{chatContent}</LandlordSidebar> : chatContent;
}
