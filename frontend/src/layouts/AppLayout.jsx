import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "Admin";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2 className="sidebar-title">Secure SME ERP</h2>

        {user && (
          <p className="user-badge">
            {user.name} <span>({user.role})</span>
          </p>
        )}

        <nav className="sidebar-nav">
          {isAdmin && <Link to="/dashboard">Dashboard</Link>}

          <Link to="/products">Products</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/sales-orders">Sales Orders</Link>
          <Link to="/invoices">Invoices</Link>
          <Link to="/inventory">Inventory</Link>

          {isAdmin && (
            <>
              <Link to="/audit-logs">Audit Logs</Link>
              <Link to="/users">Users</Link>
            </>
          )}
        </nav>

        <button type="button" onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;