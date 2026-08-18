import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTruck,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";
import "../styles/portalAuth.css";

function PortalRegisterPage({ role }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCustomer = role === "customer";
  const roleLabel = isCustomer ? "Customer" : "Supplier";
  const registerEndpoint =
    role === "customer"
      ? "/portal-auth/customer/register"
      : "/portal-auth/supplier/register";

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

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
      };

      if (role === "customer") {
        payload.address = formData.address || null;
      }

      await portalApiClient.post(registerEndpoint, payload);

      sessionStorage.setItem("pendingPortalEmail", formData.email);
      sessionStorage.setItem("pendingPortalRole", role);

      navigate(`/${role}/verify-email`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          `Failed to register ${roleLabel.toLowerCase()} account.`
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
            <span>{roleLabel} registration</span>
            <h1>
              {isCustomer
                ? "Create your customer workspace."
                : "Create your supplier workspace."}
            </h1>
            <p>
              {isCustomer
                ? "Register to browse products, checkout, and track your orders."
                : "Register to receive purchase order access and confirm deliveries."}
            </p>
          </div>

          <div className="portal-auth-checklist">
            <p>
              <FiCheckCircle />
              Email verification required
            </p>
            <p>
              <FiCheckCircle />
              Password must be at least 8 characters
            </p>
            <p>
              <FiCheckCircle />
              Access is separated by portal role
            </p>
          </div>
        </aside>

        <section className="portal-auth-card wide">
          <div className="portal-auth-header">
            <div className="portal-auth-icon">
              {isCustomer ? <FiUserPlus /> : <FiTruck />}
            </div>

            <span>Create account</span>
            <h1>{roleLabel} Registration</h1>
            <p>
              A verification code will be sent or shown in the backend terminal
              for demo testing.
            </p>
          </div>

          {error && <p className="portal-message error">{error}</p>}

          <form onSubmit={handleSubmit} className="portal-auth-form">
            <div className="portal-form-grid">
              <div className="portal-form-field">
                <label htmlFor={`${role}-name`}>Name</label>
                <div className="portal-input-with-icon">
                  <FiUser />
                  <input
                    id={`${role}-name`}
                    name="name"
                    type="text"
                    placeholder={`${roleLabel} name`}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="8"
                    required
                  />
                </div>
              </div>

              <div className="portal-form-field">
                <label htmlFor={`${role}-phone`}>Phone</label>
                <div className="portal-input-with-icon">
                  <FiPhone />
                  <input
                    id={`${role}-phone`}
                    name="phone"
                    type="text"
                    placeholder="Optional"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {role === "customer" && (
              <div className="portal-form-field">
                <label htmlFor="customer-address">Address</label>
                <div className="portal-input-with-icon textarea">
                  <FiMapPin />
                  <textarea
                    id="customer-address"
                    name="address"
                    placeholder="Optional delivery address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="portal-primary-button">
              {loading ? "Creating account..." : `Register as ${roleLabel}`}
            </button>
          </form>

          <div className="portal-auth-footer">
            <p>
              Already have an account?{" "}
              <Link to={`/${role}/login`}>Login as {roleLabel}</Link>
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

export default PortalRegisterPage;
