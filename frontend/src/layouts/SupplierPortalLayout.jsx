import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiClipboard,
  FiLogOut,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import { usePortalAuth } from "../context/PortalAuthContext";
import "../styles/supplierPortal.css";

function SupplierPortalLayout() {
  const navigate = useNavigate();
  const { portalUser, portalLoading, portalLogout } = usePortalAuth();

  if (portalLoading) {
    return (
      <section className="portal-home-page">
        <p>Loading supplier portal...</p>
      </section>
    );
  }

  if (!portalUser) {
    return <Navigate to="/supplier/login" replace />;
  }

  if (portalUser.role !== "supplier") {
    return <Navigate to={`/${portalUser.role}/home`} replace />;
  }

  function handleLogout() {
    portalLogout();
    navigate("/supplier/login");
  }

  return (
    <div className="sf-shell">
      <header className="sf-topbar">
        <div className="sf-brand">
          <div className="sf-brand-icon">
            <FiTruck />
          </div>

          <div>
            <span>CoreFlow Supplier Portal</span>
            <strong>Vendor Workspace</strong>
          </div>
        </div>

        <nav className="sf-nav" aria-label="Supplier portal navigation">
          <NavLink
            to="/supplier/purchase-orders"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FiClipboard />
            Purchase Orders
          </NavLink>
        </nav>

        <div className="sf-account">
          <span>
            <FiUser />
            {portalUser?.name || "Supplier"}
          </span>

          <button type="button" onClick={handleLogout}>
            <FiLogOut />
            Logout
          </button>
        </div>
      </header>

      <main className="sf-main">
        <Outlet />
      </main>
    </div>
  );
}

export default SupplierPortalLayout;