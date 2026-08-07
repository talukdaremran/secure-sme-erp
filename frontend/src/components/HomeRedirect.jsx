import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role === "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/products" replace />;
}

export default HomeRedirect;