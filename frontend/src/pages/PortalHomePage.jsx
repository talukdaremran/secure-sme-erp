import { Link, Navigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClipboard,
  FiLogOut,
  FiPackage,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";
import { usePortalAuth } from "../context/PortalAuthContext";
import "../styles/portalAuth.css";

function PortalHomePage({ role }) {
  const { portalUser, portalLoading, portalLogout } = usePortalAuth();

  const roleLabel = role === "customer" ? "Customer" : "Supplier";
  const isCustomer = role === "customer";

  if (portalLoading) {
    return (
      <section className="portal-auth-page">
        <p>Loading portal...</p>
      </section>
    );
  }

  if (!portalUser) {
    return <Navigate to={`/${role}/login`} replace />;
  }

  if (portalUser.role !== role) {
    return <Navigate to={`/${portalUser.role}/home`} replace />;
  }

  return (
    <section className={`portal-home-page ${role}`}>
      <div className="portal-home-card">
        <Link to="/" className="portal-back-link">
          <FiArrowLeft />
          Back to landing page
        </Link>

        <div className="portal-home-header">
          <div className="portal-auth-icon">
            {isCustomer ? <FiShoppingCart /> : <FiTruck />}
          </div>

          <div>
            <span>{roleLabel} workspace</span>
            <h1>{roleLabel} Portal</h1>
            <p>
              Logged in as <strong>{portalUser.name}</strong> ({portalUser.email})
            </p>
          </div>
        </div>

        <div className="portal-home-placeholder">
          <div>
            <FiCheckCircle />
          </div>

          <div>
            <h2>{roleLabel} portal foundation is working</h2>
            <p>
              {isCustomer
                ? "Customers can access product browsing, cart checkout, and order tracking from this workspace."
                : "Suppliers can review purchase orders and confirm delivery from this workspace."}
            </p>
          </div>
        </div>

        <div className="portal-home-actions">
          {isCustomer ? (
            <>
              <Link to="/customer/products" className="portal-primary-link">
                <FiPackage />
                Browse products
              </Link>

              <Link to="/customer/orders" className="portal-secondary-link">
                <FiClipboard />
                View orders
              </Link>
            </>
          ) : (
            <Link to="/supplier/purchase-orders" className="portal-primary-link">
              <FiClipboard />
              View purchase orders
            </Link>
          )}

          <button
            type="button"
            className="portal-secondary-button"
            onClick={portalLogout}
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}

export default PortalHomePage;
