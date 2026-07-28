import { Link, Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div>
      <aside>
        <h2>Secure SME ERP</h2>

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
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;