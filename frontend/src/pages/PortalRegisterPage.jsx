import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUserPlus } from "react-icons/fi";
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

  const roleLabel = role === "customer" ? "Customer" : "Supplier";
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
      console.log(error.response?.data || error);
      
      setError(
        error.response?.data?.message ||
          `Failed to register ${roleLabel.toLowerCase()} account.`
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
            <FiUserPlus />
          </div>

          <h1>{roleLabel} Registration</h1>

          <p>
            Create your {roleLabel.toLowerCase()} portal account. A verification
            code will be sent or shown in the backend terminal for demo.
          </p>
        </div>

        {error && <p className="message error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="portal-auth-form">
          <div className="form-field">
            <label htmlFor={`${role}-name`}>Name</label>
            <input
              id={`${role}-name`}
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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
              minLength="8"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${role}-phone`}>Phone</label>
            <input
              id={`${role}-phone`}
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {role === "customer" && (
            <div className="form-field">
              <label htmlFor="customer-address">Address</label>
              <textarea
                id="customer-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
              />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : `Register as ${roleLabel}`}
          </button>
        </form>

        <p className="portal-auth-footer">
          Already have an account?{" "}
          <Link to={`/${role}/login`}>Login as {roleLabel}</Link>
        </p>
      </div>
    </section>
  );
}

export default PortalRegisterPage;