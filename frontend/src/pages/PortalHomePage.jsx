import { Link, Navigate } from "react-router-dom";
import { FiArrowLeft, FiLogOut } from "react-icons/fi";
import { usePortalAuth } from "../context/PortalAuthContext";

function PortalHomePage({ role }) {
  const { portalUser, portalLoading, portalLogout } = usePortalAuth();

  const roleLabel = role === "customer" ? "Customer" : "Supplier";

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
    <section className="portal-home-page">
      <div className="portal-home-card">
        <Link to="/" className="back-link">
          <FiArrowLeft />
          Back to landing page
        </Link>

        <h1>{roleLabel} Portal</h1>

        <p>
          Logged in as <strong>{portalUser.name}</strong> ({portalUser.email})
        </p>

        <div className="portal-home-placeholder">
          <h2>{roleLabel} portal foundation is working</h2>

          <p>
            The next issue will add the actual {roleLabel.toLowerCase()} portal
            features.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={portalLogout}
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </section>
  );
}

export default PortalHomePage;