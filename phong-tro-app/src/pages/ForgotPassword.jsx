import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email → otp → newpassword → success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Bước 1 — Gửi OTP qua backend
  const handleSendOTP = async () => {
    if (!email) return setError("Vui lòng nhập email!");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Email không hợp lệ!");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, { email });
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi mã OTP!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2 — Xác nhận OTP qua backend
  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) return setError("Vui lòng nhập đủ 6 số!");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, { email, otp: otpValue });
      setStep("newpassword");
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không đúng!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 3 — Đặt mật khẩu mới
  const handleResetPassword = async () => {
    if (!newPassword) return setError("Vui lòng nhập mật khẩu mới!");
    if (newPassword.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    if (newPassword !== confirmPassword) return setError("Mật khẩu xác nhận không khớp!");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        email,
        otp: otp.join(""),
        newPassword,
      });
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đặt lại mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý nhập OTP từng ô
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: `1.5px solid ${error ? "#ff4444" : "#e5e2da"}`,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "Nunito"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fff5f0 0%, #fff 50%, #fff8f0 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Nunito', sans-serif", padding: 20
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div onClick={() => navigate("/")} style={{
            width: 56, height: 56, borderRadius: 16, cursor: "pointer",
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26
          }}>🏠</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 24, color: "#1a1a1a", marginTop: 10 }}>TrọTốt</div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 40, boxShadow: "0 8px 40px rgba(255,107,53,0.12)" }}>

          {/* Bước 1 — Nhập Email */}
          {step === "email" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
                <h2 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>Quên mật khẩu?</h2>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Nhập email để nhận mã xác nhận</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Email</label>
                <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  placeholder="example@gmail.com" type="email" style={inputStyle} />
              </div>

              {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>⚠️ {error}</div>}

              <button onClick={handleSendOTP} disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>
                {loading ? " Đang gửi..." : " Gửi mã xác nhận"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <span onClick={() => navigate("/login")} style={{ color: "#ff6b35", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ← Quay lại đăng nhập
                </span>
              </div>
            </>
          )}

          {/* Bước 2 — Nhập OTP */}
          {step === "otp" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                <h2 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>Nhập mã xác nhận</h2>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
                  Mã OTP đã gửi về<br />
                  <strong style={{ color: "#ff6b35" }}>{email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    maxLength={1}
                    style={{
                      width: 52, height: 56, textAlign: "center",
                      fontSize: 22, fontWeight: 800, borderRadius: 12,
                      border: `2px solid ${digit ? "#ff6b35" : "#e5e2da"}`,
                      outline: "none", color: "#1a1a1a",
                      background: digit ? "rgba(255,107,53,0.05)" : "#fff",
                    }}
                  />
                ))}
              </div>

              <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginBottom: 20 }}>
                ⏰ Mã có hiệu lực trong <strong>5 phút</strong>
              </p>

              {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, fontWeight: 600, textAlign: "center" }}>⚠️ {error}</div>}

              <button onClick={handleVerifyOTP} disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>{loading ? "⏳ Đang xác nhận..." : "✅ Xác nhận"}</button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <span onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                  style={{ color: "#ff6b35", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Gửi lại mã
                </span>
              </div>
            </>
          )}

          {/* Bước 3 — Đặt mật khẩu mới */}
          {step === "newpassword" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <h2 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>Đặt mật khẩu mới</h2>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Mật khẩu tối thiểu 6 ký tự</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Mật khẩu mới</label>
                <div style={{ position: "relative" }}>
                  <input value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(""); }}
                    type={showPass ? "text" : "password"} placeholder="Nhập mật khẩu mới"
                    style={{ ...inputStyle, paddingRight: 48 }} />
                  <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 18 }}>
                    {showPass ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Xác nhận mật khẩu</label>
                <input value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                  type={showPass ? "text" : "password"} placeholder="Nhập lại mật khẩu"
                  style={inputStyle} />
              </div>

              {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>⚠️ {error}</div>}

              <button onClick={handleResetPassword} disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>
                {loading ? "⏳ Đang lưu..." : "🔑 Đặt lại mật khẩu"}
              </button>
            </>
          )}

          {/* Bước 4 — Thành công */}
          {step === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: "0 0 12px", fontWeight: 900, fontSize: 22, color: "#1a1a1a" }}>Thành công!</h2>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>
                Mật khẩu đã được đặt lại thành công.<br />Vui lòng đăng nhập lại!
              </p>
              <button onClick={() => navigate("/login")} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
              }}>🚀 Đăng nhập ngay</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
