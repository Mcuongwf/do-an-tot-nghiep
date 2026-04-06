import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/landlord/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Profile from "./pages/Profile";
import RoomDetail from "./pages/RoomDetail";
import AddRoom from "./pages/landlord/AddRoom";
import MaintenancePage from "./pages/landlord/MaintenancePage";
import ContractPage from "./pages/landlord/ContractPage";
import ForgotPassword from "./pages/ForgotPassword";
import Messages from "./pages/Messages";
import MyBookings from "./pages/MyBookings";
import MyContracts from "./pages/MyContracts";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<Route path="/rooms/:id" element={<RoomDetail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Đăng nhập mới vào được */}
        <Route path="/messages" element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } />
        <Route path="/my-contracts" element={
          <ProtectedRoute allowedRoles={["tenant"]}>
            <MyContracts />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Chỉ landlord */}
        <Route path="/landlord/dashboard" element={
          <ProtectedRoute allowedRoles={["landlord"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/landlord/add-room" element={
          <ProtectedRoute allowedRoles={["landlord"]}>
            <AddRoom />
          </ProtectedRoute>
        } />
        <Route path="/landlord/maintenance" element={
          <ProtectedRoute allowedRoles={["landlord"]}>
            <MaintenancePage />
          </ProtectedRoute>
        } />
        <Route path="/landlord/contracts" element={
          <ProtectedRoute allowedRoles={["landlord"]}>
            <ContractPage />
          </ProtectedRoute>
        } />

        {/* Chỉ admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;