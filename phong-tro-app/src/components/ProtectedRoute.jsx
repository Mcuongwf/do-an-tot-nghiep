import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * allowedRoles: mảng role được phép, vd: ["landlord"], ["admin"], ["tenant", "landlord"]
 * Nếu không truyền allowedRoles → chỉ cần đăng nhập là vào được
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "landlord") return <Navigate to="/landlord/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
