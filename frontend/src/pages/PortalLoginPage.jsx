import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiClipboard,
  FiLock,
  FiMail,
  FiPackage,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";
import { usePortalAuth } from "../context/PortalAuthContext";
import "../styles/portalAuth.css";

function PortalLoginPage({ role }) {
  const navigate = useNavigate();
  const { portalLogin } = usePortalAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCustomer = role === "customer";
  const roleLabel = isCustomer ? "Customer" : "Supplier";

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const portalUser = await portalLogin({
        email: formData.email,
        password: formData.password,
        expectedRole: role,
      });

      if (portalUser.role === "customer") {
        navigate("/customer/home");
      } else {
        navigate("/supplier/home");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          `Failed to login to ${roleLabel} Portal.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`portal-auth-page ${role}`}>
      <div className="portal-auth-shell">
        <aside className="portal-auth-side">
          <Link to="/" className="portal-back-link">
            <FiArrowLeft />
            Back to landing page
          </Link>

          <div className="portal-auth-side-copy">
            <span>{roleLabel} Portal</span>
            <h1>
              {isCustomer
                ? "Track orders and manage purchases."
                : "Manage purchase orders and deliveries."}
            </h1>
            <p>
              {isCustomer
                ? "Access product browsing, checkout, and order tracking through the CoreFlow customer workspace."
                : "Review assigned purchase orders and confirm supplier delivery through the CoreFlow vendor workspace."}
            </p>
          </div>

          <div className="portal-auth-feature-list">
            <div>
              {isCustomer ? <FiPackage /> : <FiClipboard />}
              <p>{isCustomer ? "Product access" : "Purchase order access"}</p>
            </div>

            <div>
              {isCustomer ? <FiShoppingCart /> : <FiTruck />}
              <p>{isCustomer ? "Order tracking" : "Delivery confirmation"}</p>
            </div>

            <div>
              <FiLock />
              <p>Email-verified portal access</p>
            </div>
          </div>
        </aside>

        <section className="portal-auth-card">
          <div className="portal-auth-header">
            <div className="portal-auth-icon">
              {isCustomer ? <FiShoppingCart /> : <FiTruck />}
            </div>

            <span>{roleLabel} sign in</span>
            <h1>Welcome back</h1>
            <p>Login to access your {roleLabel.toLowerCase()} workspace.</p>
          </div>

          {error && <p className="portal-message error">{error}</p>}

          <form onSubmit={handleSubmit} className="portal-auth-form">
            <div className="portal-form-field">
              <label htmlFor={`${role}-email`}>Email address</label>
              <div className="portal-input-with-icon">
                <FiMail />
                <input
                  id={`${role}-email`}
                  name="email"
                  type="email"
                  placeholder={`${role}@coreflow.test`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="portal-form-field">
              <label htmlFor={`${role}-password`}>Password</label>
              <div className="portal-input-with-icon">
                <FiLock />
                <input
                  id={`${role}-password`}
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="portal-primary-button">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="portal-auth-footer">
            <p>
              Need an account?{" "}
              <Link to={`/${role}/register`}>Register as {roleLabel}</Link>
            </p>

            <p>
              Already registered?{" "}
              <Link to={`/${role}/verify-email`}>Verify email</Link>
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

export default PortalLoginPage;
