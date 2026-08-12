import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLogOut, FiTruck } from "react-icons/fi";
import { usePortalAuth } from "../context/PortalAuthContext";

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
    <section className="supplier-portal-shell">
      <header className="supplier-portal-header">
        <Link to="/" className="back-link">
          <FiArrowLeft />
          Landing
        </Link>

        <div>
          <h1>Supplier Portal</h1>
          <p>Welcome, {portalUser.name}</p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>
      </header>

      <nav className="supplier-portal-nav">
        <NavLink to="/supplier/purchase-orders">
          <FiTruck />
          Purchase Orders
        </NavLink>
      </nav>

      <Outlet />
    </section>
  );
}

export default SupplierPortalLayout;