const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { sequelize } = require("./models/index");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Gắn io vào app để dùng trong routes
app.set("io", io);

app.use(cors());
app.use(express.json());

// Kết nối MySQL
sequelize.authenticate()
  .then(() => console.log(" Kết nối MySQL thành công!"))
  .catch((err) => console.log(" Lỗi kết nối:", err.message));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/users", require("./routes/users"));
app.use("/api/contracts", require("./routes/contracts"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/chat", require("./routes/chat"));

app.get("/", (req, res) => {
  res.json({ message: " Server TrọTốt đang chạy!" });
});

// Socket.io: mỗi user join room riêng theo userId
io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
  });
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server chạy tại http://localhost:${PORT}`);
});
