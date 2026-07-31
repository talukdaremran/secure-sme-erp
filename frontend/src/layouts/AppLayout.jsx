import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBox,
  FiClipboard,
  FiFileText,
  FiLogOut,
  FiShoppingCart,
  FiShield,
  FiUsers,
  FiLayers,
} from "react-icons/fi";
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
        <div className="brand">
          <div className="brand-icon">
            <FiLayers />
          </div>

          <div>
            <h2>SME ERP</h2>
            <p>Secure Business Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <NavLink to="/dashboard">
              <FiBarChart2 />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink to="/products">
            <FiBox />
            <span>Products</span>
          </NavLink>

          <NavLink to="/customers">
            <FiUsers />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/sales-orders">
            <FiShoppingCart />
            <span>Sales Orders</span>
          </NavLink>

          <NavLink to="/invoices">
            <FiFileText />
            <span>Invoices</span>
          </NavLink>

          <NavLink to="/inventory">
            <FiArchive />
            <span>Inventory</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/audit-logs">
                <FiActivity />
                <span>Audit Logs</span>
              </NavLink>

              <NavLink to="/users">
                <FiClipboard />
                <span>Users</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-card">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
            </div>
          )}

          <button type="button" onClick={handleLogout} className="logout-button">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Secure SME ERP</p>
            <h1>Business Management System</h1>
          </div>

          {user && (
            <div className="topbar-user">
              <span>{user.role}</span>
              <div className="topbar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;