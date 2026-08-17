import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLock } from "react-icons/fi";
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

  const roleLabel = role === "customer" ? "Customer" : "Supplier";

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
    <section className="portal-auth-page">
      <div className="portal-auth-card">
        <Link to="/" className="back-link">
          <FiArrowLeft />
          Back to landing page
        </Link>

        <div className="portal-auth-header">
          <div className="portal-auth-icon">
            <FiLock />
          </div>

          <h1>{roleLabel} Portal Login</h1>

          <p>
            Login to access your {roleLabel.toLowerCase()} portal account.
          </p>
        </div>

        {error && <p className="message error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="portal-auth-form">
          <div className="form-field">
            <label htmlFor={`${role}-email`}>Email</label>
            <input
              id={`${role}-email`}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${role}-password`}>Password</label>
            <input
              id={`${role}-password`}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="portal-auth-footer">
          Need an account?{" "}
          <Link to={`/${role}/register`}>Register as {roleLabel}</Link>
        </p>

        <p className="portal-auth-footer">
          Already registered?{" "}
          <Link to={`/${role}/verify-email`}>Verify email</Link>
        </p>
      </div>
    </section>
  );
}

export default PortalLoginPage;