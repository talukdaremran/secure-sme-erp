import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (user?.role !== "Admin") {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;