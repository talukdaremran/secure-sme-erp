import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const mustChangePassword = user.must_change_password === true;
  const isChangePasswordPage = location.pathname === "/change-password";

  if (mustChangePassword && !isChangePasswordPage) {
    return <Navigate to="/change-password" replace />;
  }

  if (!mustChangePassword && isChangePasswordPage) {
    if (user.role === "Admin") {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;