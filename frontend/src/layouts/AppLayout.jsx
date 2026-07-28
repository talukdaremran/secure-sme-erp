import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <aside>
        <h2>Secure SME ERP</h2>

        {user && (
          <p>
            Logged in as {user.name} ({user.role})
          </p>
        )}

        <nav>
          <Link to="/dashboard">Dashboard</Link>{" | "}
          <Link to="/products">Products</Link>{" | "}
          <Link to="/customers">Customers</Link>{" | "}
          <Link to="/sales-orders">Sales Orders</Link>{" | "}
          <Link to="/invoices">Invoices</Link>{" | "}
          <Link to="/inventory">Inventory</Link>{" | "}
          <Link to="/audit-logs">Audit Logs</Link>{" | "}
          <Link to="/users">Users</Link>
        </nav>

        <br />

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;