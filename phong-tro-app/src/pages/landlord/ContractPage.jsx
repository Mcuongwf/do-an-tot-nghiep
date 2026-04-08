import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ToastContainer, { useToast } from "../../components/Toast";
import LandlordSidebar from "../../components/LandlordSidebar";
import { SkeletonRow, Pagination } from "../../components/Skeleton";

const PAGE_SIZE = 8;
//hàm khai báo trạng thái
const STATUS_STYLE = {
  "active":     { bg: "rgba(46,196,182,0.1)",  color: "#2ec4b6",  label: "Đang hiệu lực" },
  "expired":    { bg: "rgba(247,147,30,0.1)",  color: "#f7931e",  label: "Hết hạn" },
  "terminated": { bg: "rgba(255,68,68,0.1)",   color: "#ff4444",  label: "Đã thanh lý" },
};
//khởi tạo của trang quản lý hợp đồng
export default function ContractPage() {
  const navigate = useNavigate();
  const { toasts, toast } = useToast();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    room: "", tenant: "", startDate: "", endDate: "",
    price: "", deposit: "", electricPrice: "3500",
    waterPrice: "15000", internetPrice: "0", note: ""
  });
  const [editForm, setEditForm] = useState({
    startDate: "", endDate: "", price: "", deposit: "",
    electricPrice: "", waterPrice: "", internetPrice: "", note: ""
  });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
//hàm fetchALL data lấy dữ liệu
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [contractsRes, roomsRes, usersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/contracts`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/my`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/users/tenants`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);
      setContracts(contractsRes.data || []);
      setRooms(roomsRes.data.rooms || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.log("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };
//hàm tạo hợp đồng mới
  const handleAdd = async () => {
    if (!form.room) { toast("Vui lòng chọn phòng!", "error"); return; }
    if (!form.tenant) { toast("Vui lòng chọn khách thuê!", "error"); return; }
    if (!form.startDate) { toast("Vui lòng chọn ngày bắt đầu!", "error"); return; }
    if (!form.endDate) { toast("Vui lòng chọn ngày kết thúc!", "error"); return; }
    if (!form.price) { toast("Vui lòng nhập giá thuê!", "error"); return; }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contracts`, {
        ...form,
        price: Number(form.price),
        deposit: Number(form.deposit),
        electricPrice: Number(form.electricPrice),
        waterPrice: Number(form.waterPrice),
        internetPrice: Number(form.internetPrice),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddModal(false);
      setForm({ room: "", tenant: "", startDate: "", endDate: "", price: "", deposit: "", electricPrice: "3500", waterPrice: "15000", internetPrice: "0", note: "" });
      fetchAll();
      toast("Tạo hợp đồng thành công!", "success");
    } catch (err) {
      toast("Lỗi: " + (err.response?.data?.message || err.message), "error");
    }
  };
//hàm cbi dữ liệu để chỉnh sửa
  const openEdit = (c) => {
    setSelected(c);
    setEditForm({
      startDate: c.startDate?.slice(0, 10) || "",
      endDate: c.endDate?.slice(0, 10) || "",
      price: c.price || "",
      deposit: c.deposit || "",
      electricPrice: c.electricPrice || "3500",
      waterPrice: c.waterPrice || "15000",
      internetPrice: c.internetPrice || "0",
      note: c.note || "",
    });
    setShowEditModal(true);
  };
//hàm chỉnh sủa/ cập nhật hợp đồng
  const handleEdit = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/contracts/${selected.id}`, {
        ...editForm,
        price: Number(editForm.price),
        deposit: Number(editForm.deposit),
        electricPrice: Number(editForm.electricPrice),
        waterPrice: Number(editForm.waterPrice),
        internetPrice: Number(editForm.internetPrice),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false);
      fetchAll();
      toast("Cập nhật hợp đồng thành công!", "success");
    } catch {
      toast("Lỗi cập nhật hợp đồng!", "error");
    }
  };
//hàm thanh lý hợp đồng
  const handleTerminate = async (id) => {
    if (!window.confirm("Xác nhận thanh lý hợp đồng này?")) return;
    try {
      const contract = contracts.find(c => c.id === id);
      await axios.put(`${process.env.REACT_APP_API_URL}/api/contracts/${id}`, { status: "terminated" }, { headers: { Authorization: `Bearer ${token}` } });
      setContracts(prev => prev.map(c => c.id === id ? { ...c, status: "terminated" } : c));
      const roomId = contract?.room_id || contract?.room?.id;
      if (roomId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/rooms/${roomId}`, { status: "Còn trống" }, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast("Đã thanh lý hợp đồng!", "success");
    } catch (err) {
      toast("Lỗi thanh lý!", "error");
    }
  };

  const filtered = filterStatus === "Tất cả" ? contracts : contracts.filter(c => c.status === filterStatus);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Tổng hợp đồng", value: contracts.length, color: "#4361ee" },
    { label: "Đang hiệu lực", value: contracts.filter(c => c.status === "active").length, color: "#2ec4b6" },
    { label: "Hết hạn", value: contracts.filter(c => c.status === "expired").length, color: "#f7931e" },
  ];

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
//hàm in/xuất file hợp đồng
  const handlePrintInvoice = (c) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const startD = c.startDate ? new Date(c.startDate) : null;
    const endD = c.endDate ? new Date(c.endDate) : null;
    const months = startD && endD ? Math.round((endD - startD) / (1000 * 60 * 60 * 24 * 30)) : "...";
    const address = c.room?.address || c.room?.district || "...";
    const contractId = String(c.id || c.id || "").padStart(8, '0');

    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Hợp đồng thuê phòng</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Times New Roman", Times, serif; max-width: 750px; margin: 0 auto; color: #111; font-size: 14px; line-height: 1.8; padding: 20px 30px; }
        .header-state { text-align: center; font-weight: bold; font-size: 15px; text-transform: uppercase; margin-bottom: 0; }
        .header-motto { text-align: center; font-size: 13px; margin-bottom: 2px; }
        .header-line { text-align: center; font-size: 13px; margin-bottom: 20px; }
        .divider-line { border: none; border-bottom: 1px solid #111; width: 200px; margin: 0 auto 4px; }
        .title { text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 20px 0 4px; letter-spacing: 1px; }
        .contract-id { text-align: center; font-size: 13px; margin-bottom: 4px; }
        .contract-date { text-align: center; font-size: 13px; margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin: 18px 0 8px; }
        .party-name { font-weight: bold; text-decoration: underline; font-size: 14px; margin: 10px 0 6px; }
        .field-line { margin: 4px 0; }
        .dotted { display: inline-block; min-width: 220px; border-bottom: 1px dotted #555; }
        .dotted-sm { display: inline-block; min-width: 120px; border-bottom: 1px dotted #555; }
        .dotted-lg { display: inline-block; min-width: 340px; border-bottom: 1px dotted #555; }
        .filled { font-weight: bold; }
        .article { margin: 16px 0 8px; font-weight: bold; }
        .indent { padding-left: 20px; margin: 4px 0; }
        .sign-section { display: flex; justify-content: space-between; margin-top: 60px; }
        .sign-box { text-align: center; width: 45%; }
        .sign-title { font-weight: bold; margin-bottom: 4px; }
        .sign-sub { font-size: 12px; font-style: italic; margin-bottom: 50px; }
        .sign-name { border-top: 1px solid #111; padding-top: 6px; font-size: 13px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { .no-print { display: none !important; } }
      </style></head><body>

      <p class="header-state">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
      <p class="header-motto">Độc lập - Tự do - Hạnh phúc</p>
      <div class="divider-line"></div>
      <p class="header-line">───────────────</p>

      <div class="title">Hợp đồng thuê phòng trọ</div>
      <div class="contract-id">Số hợp đồng: ${contractId}</div>
      <div class="contract-date">
        Hôm nay, ngày <span class="filled">${dd}</span> tháng <span class="filled">${mm}</span> năm <span class="filled">${yyyy}</span>,
        tại: <span class="filled">${address}</span>
      </div>

      <p style="margin:8px 0;">Chúng tôi gồm có:</p>

      <div class="party-name">I. BÊN CHO THUÊ (BÊN A)</div>
      <div class="field-line">Họ và tên: <span class="dotted filled">${user.name || ""}</span></div>
      <div class="field-line">CCCD số: <span class="dotted-sm dotted"></span> &nbsp; Ngày cấp: <span class="dotted-sm dotted"></span> &nbsp; Nơi cấp: <span class="dotted-sm dotted"></span></div>
      <div class="field-line">Địa chỉ thường trú: <span class="dotted-lg dotted"></span></div>
      <div class="field-line">Số điện thoại: <span class="dotted filled">${user.phone || ""}</span></div>

      <div class="party-name">II. BÊN THUÊ (BÊN B)</div>
      <div class="field-line">Họ và tên: <span class="dotted filled">${c.tenant?.name || ""}</span></div>
      <div class="field-line">CCCD số: <span class="dotted-sm dotted"></span> &nbsp; Ngày cấp: <span class="dotted-sm dotted"></span> &nbsp; Nơi cấp: <span class="dotted-sm dotted"></span></div>
      <div class="field-line">Địa chỉ thường trú: <span class="dotted-lg dotted"></span></div>
      <div class="field-line">Số điện thoại: <span class="dotted filled">${c.tenant?.phone || ""}</span></div>

      <p style="margin:14px 0 8px;">Hai bên cùng thống nhất các điều khoản thuê phòng như sau:</p>

      <div class="article">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</div>
      <div class="indent">Bên A đồng ý cho bên B thuê phòng: <span class="filled">${c.room?.title || "..."}</span></div>
      <div class="indent">tại địa chỉ: <span class="filled">${address}</span></div>
      <div class="indent">Thời hạn thuê: <span class="filled">${months}</span> tháng (Từ ngày <span class="filled">${formatDate(c.startDate)}</span> đến ngày <span class="filled">${formatDate(c.endDate)}</span>).</div>

      <div class="article">ĐIỀU 2: GIÁ THUÊ VÀ CHI PHÍ KHÁC</div>
      <div class="indent">Giá thuê phòng: <span class="filled">${formatPrice(c.price)} VNĐ/tháng</span>.</div>
      <div class="indent">Tiền đặt cọc: <span class="filled">${formatPrice(c.deposit)} VNĐ</span>. (Số tiền này sẽ được trả lại sau khi thanh lý hợp đồng và trừ đi các chi phí hỏng hóc hoặc nợ tiền nhà nếu có).</div>
      <div class="indent">Tiền điện: <span class="filled">${formatPrice(c.electricPrice)} VNĐ/kWh</span>.</div>
      <div class="indent">Tiền nước: <span class="filled">${formatPrice(c.waterPrice)} VNĐ/m³</span>.</div>
      ${c.note ? `<div class="indent">Ghi chú: <span class="filled">${c.note}</span></div>` : ""}
      <div class="indent">Thời hạn thanh toán: Từ ngày <span class="dotted-sm dotted"></span> đến ngày <span class="dotted-sm dotted"></span> hàng tháng.</div>

      <div class="article">ĐIỀU 3: TRÁCH NHIỆM CỦA BÊN A</div>
      <div class="indent">- Bàn giao phòng và các trang thiết bị kèm theo (nếu có) cho bên B đúng thời hạn.</div>
      <div class="indent">- Đảm bảo quyền sử dụng phòng độc lập, riêng tư cho bên B.</div>
      <div class="indent">- Sửa chữa kịp thời các hư hỏng liên quan đến kết cấu nhà (dột, hỏng hệ thống điện nước chính).</div>

      <div class="article">ĐIỀU 4: TRÁCH NHIỆM CỦA BÊN B</div>
      <div class="indent">- Thanh toán tiền thuê và các chi phí đầy đủ, đúng hạn.</div>
      <div class="indent">- Sử dụng phòng đúng mục đích để ở, không kinh doanh hàng cấm, không gây mất an ninh trật tự.</div>
      <div class="indent">- Giữ gìn vệ sinh chung và bảo quản các trang thiết bị có sẵn. Nếu làm hỏng phải bồi thường theo giá thị trường.</div>
      <div class="indent">- Phải tuân thủ các quy định về đăng ký tạm trú và nội quy khu trọ.</div>

      <div class="article">ĐIỀU 5: ĐIỀU KHOẢN CHUNG</div>
      <div class="indent">- Bên nào muốn chấm dứt hợp đồng trước thời hạn phải thông báo cho bên kia ít nhất 30 ngày.</div>
      <div class="indent">- Nếu bên B dọn đi trước thời hạn mà không báo trước hoặc vi phạm nghiêm trọng hợp đồng, bên A có quyền không hoàn lại tiền cọc.</div>
      <div class="indent">- Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.</div>

      <div class="sign-section">
        <div class="sign-box">
          <div class="sign-title">ĐẠI DIỆN BÊN A</div>
          <div class="sign-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sign-name">${user.name || ""}</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">ĐẠI DIỆN BÊN B</div>
          <div class="sign-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sign-name">${c.tenant?.name || ""}</div>
        </div>
      </div>

      <div class="footer">TrọTốt — Nền tảng cho thuê phòng trọ</div>

      <div class="no-print" style="text-align:center;margin-top:24px;">
        <button onclick="downloadPDF()" style="padding:10px 28px;background:#ff6b35;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:Arial;">Tải PDF</button>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        function downloadPDF() {
          var btn = document.querySelector('[onclick="downloadPDF()"]');
          btn.style.display = 'none';
          html2pdf().set({
            margin: [10, 10, 10, 10],
            filename: 'HopDong_${contractId}.pdf',
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.body.scrollWidth, windowHeight: document.body.scrollHeight },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).from(document.body).save().then(function() {
            btn.style.display = '';
          });
        }
      </script>
      </body></html>
    `);
    win.document.close();
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #e5e2da", fontSize: 13,
    fontFamily: "Nunito", outline: "none", boxSizing: "border-box"
  };

  const selectStyle = { ...inputStyle, background: "#fff" };

  return (
    <LandlordSidebar>
    <ToastContainer toasts={toasts} />
      <div style={{ padding: "32px 40px", fontFamily: "'Nunito', sans-serif", overflowY: "auto", flex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 28 }}>Quản lý hợp đồng</h1>
            <p style={{ color: "#888", margin: 0, fontSize: 14 }}>Quản lý toàn bộ hợp đồng thuê phòng</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ff6b35, #f7931e)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
            Tạo hợp đồng
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ color: "#888", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["Tất cả", "active", "expired"].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
              padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13, fontFamily: "Nunito",
              background: filterStatus === s ? "linear-gradient(135deg,#ff6b35,#f7931e)" : "#fff",
              color: filterStatus === s ? "#fff" : "#888",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              {s === "Tất cả" ? "Tất cả" : s === "active" ? "Đang hiệu lực" : "Hết hạn"}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 700 }}>Chưa có hợp đồng nào</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f7f4" }}>
                    {["Phòng", "Khách thuê", "Giá thuê / Cọc", "Thời hạn", "Trạng thái", "Thao tác"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#888" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.room?.title || "—"}</div>
                        <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>{c.room?.district || ""}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.tenant?.name || "—"}</div>
                        <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>{c.tenant?.phone || ""}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 800, color: "#ff6b35", fontSize: 13 }}>{formatPrice(c.price)}đ</div>
                        <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>Cọc: {formatPrice(c.deposit)}đ</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{formatDate(c.startDate)}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>→ {formatDate(c.endDate)}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_STYLE[c.status]?.bg || "#f8f7f4", color: STATUS_STYLE[c.status]?.color || "#888", whiteSpace: "nowrap" }}>
                          {STATUS_STYLE[c.status]?.label || c.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => { setSelected(c); setShowDetailModal(true); }} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(67,97,238,0.1)", color: "#4361ee", fontWeight: 700, fontSize: 11 }}>Chi tiết</button>
                          {c.status !== "terminated" && (
                            <button onClick={() => openEdit(c)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(46,196,182,0.1)", color: "#2ec4b6", fontWeight: 700, fontSize: 11 }}>Sửa</button>
                          )}
                          <button onClick={() => handlePrintInvoice(c)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,107,53,0.1)", color: "#ff6b35", fontWeight: 700, fontSize: 11 }}>Xuất HĐ</button>
                          {c.status === "active" && (
                            <button onClick={() => handleTerminate(c.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,68,68,0.1)", color: "#ff4444", fontWeight: 700, fontSize: 11 }}>Thanh lý</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* MODAL SỬA HỢP ĐỒNG */}
      {showEditModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 900, fontSize: 20 }}>Sửa hợp đồng</h3>
            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#555", fontWeight: 700 }}>
              {selected.room?.title} — {selected.tenant?.name}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { label: "Ngày bắt đầu", field: "startDate", type: "date" },
                { label: "Ngày kết thúc", field: "endDate", type: "date" },
                { label: "Giá thuê/tháng (đ)", field: "price", type: "number" },
                { label: "Tiền đặt cọc (đ)", field: "deposit", type: "number" },
                { label: "Giá điện (đ/kWh)", field: "electricPrice", type: "number" },
                { label: "Giá nước (đ/m³)", field: "waterPrice", type: "number" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type={type} value={editForm[field]} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Ghi chú</label>
              <textarea value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                style={{ ...inputStyle, resize: "none", height: 70 }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleEdit} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO HỢP ĐỒNG */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20, overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", margin: "auto" }}>
            <h3 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: 20 }}>➕ Tạo hợp đồng mới</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Phòng *</label>
                <select value={form.room} onChange={e => {
                  const r = rooms.find(r => String(r.id) === e.target.value);
                  setForm({ ...form, room: e.target.value,
                    price: r?.price || "",
                    electricPrice: r?.electricPrice || "3500",
                    waterPrice: r?.waterPrice || "15000",
                    internetPrice: r?.internetPrice || "0",
                  });
                }} style={selectStyle}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.title} - {r.district}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Khách thuê *</label>
                <select value={form.tenant} onChange={e => setForm({ ...form, tenant: e.target.value })} style={selectStyle}>
                  <option value="">-- Chọn khách thuê --</option>
                  {users.filter(u => u.role === "tenant").map(u => <option key={u.id} value={u.id}>{u.name} - {u.phone || u.email}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Ngày bắt đầu *</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Ngày kết thúc *</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Giá thuê/tháng (đ) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="3000000" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Tiền đặt cọc (đ)</label>
                <input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Giá điện (đ/kWh)</label>
                <input type="number" value={form.electricPrice} onChange={e => setForm({ ...form, electricPrice: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Giá nước (đ/m³)</label>
                <input type="number" value={form.waterPrice} onChange={e => setForm({ ...form, waterPrice: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Ghi chú</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú thêm về hợp đồng..."
                style={{ ...inputStyle, resize: "none", height: 70 }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleAdd} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b35,#f7931e)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>✅ Tạo hợp đồng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT */}
      {showDetailModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>📋 Chi tiết hợp đồng</h3>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_STYLE[selected.status]?.bg, color: STATUS_STYLE[selected.status]?.color }}>
                {STATUS_STYLE[selected.status]?.label}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Phòng", value: selected.room?.title },
                { label: "Khách thuê", value: selected.tenant?.name },
                { label: "SĐT khách", value: selected.tenant?.phone || "—" },
                { label: "Email khách", value: selected.tenant?.email || "—" },
                { label: "Ngày bắt đầu", value: formatDate(selected.startDate) },
                { label: "Ngày kết thúc", value: formatDate(selected.endDate) },
                { label: "Giá thuê", value: `${formatPrice(selected.price)}đ/tháng` },
                { label: "Tiền cọc", value: `${formatPrice(selected.deposit)}đ` },
                { label: "Giá điện", value: `${formatPrice(selected.electricPrice)}đ/kWh` },
                { label: "Giá nước", value: `${formatPrice(selected.waterPrice)}đ/m³` },
              ].map((item, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.value || "—"}</div>
                </div>
              ))}
            </div>

            {selected.note && (
              <div style={{ background: "#f8f7f4", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Ghi chú</div>
                <div style={{ fontSize: 13, color: "#555" }}>{selected.note}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e2da", background: "#fff", color: "#888", fontWeight: 700, cursor: "pointer" }}>Đóng</button>
              <button onClick={() => handlePrintInvoice(selected)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "rgba(255,107,53,0.1)", color: "#ff6b35", fontWeight: 700, cursor: "pointer" }}>Xuất hợp đồng</button>
              {selected.status === "active" && (
                <button onClick={() => { handleTerminate(selected.id); setShowDetailModal(false); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "rgba(255,68,68,0.1)", color: "#ff4444", fontWeight: 700, cursor: "pointer" }}>Thanh lý</button>
              )}
            </div>
          </div>
        </div>
      )}
    </LandlordSidebar>
  );
}
