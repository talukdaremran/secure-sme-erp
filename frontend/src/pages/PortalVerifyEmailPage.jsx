import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";

function PortalVerifyEmailPage({ role }) {
  const navigate = useNavigate();

  const storedEmail = sessionStorage.getItem("pendingPortalEmail") || "";
  const roleLabel = role === "customer" ? "Customer" : "Supplier";

  const [formData, setFormData] = useState({
    email: storedEmail,
    code: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setSuccessMessage("");

      await portalApiClient.post("/portal-auth/verify-email", {
        email: formData.email,
        code: formData.code,
      });

      sessionStorage.removeItem("pendingPortalEmail");
      sessionStorage.removeItem("pendingPortalRole");

      setSuccessMessage("Email verified successfully. Redirecting to login...");

      setTimeout(() => {
        navigate(`/${role}/login`);
      }, 900);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to verify email.");
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
            <FiCheckCircle />
          </div>

          <h1>Verify {roleLabel} Email</h1>

          <p>
            Enter the verification code sent to your email. During demo, check
            the backend terminal for the code.
          </p>
        </div>

        {error && <p className="message error-message">{error}</p>}
        {successMessage && (
          <p className="message success-message">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit} className="portal-auth-form">
          <div className="form-field">
            <label htmlFor={`${role}-verify-email`}>Email</label>
            <input
              id={`${role}-verify-email`}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${role}-verification-code`}>
              Verification Code
            </label>
            <input
              id={`${role}-verification-code`}
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <p className="portal-auth-footer">
          Already verified? <Link to={`/${role}/login`}>Go to login</Link>
        </p>
      </div>
    </section>
  );
}

export default PortalVerifyEmailPage;