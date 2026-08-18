import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiKey,
  FiMail,
  FiShield,
} from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";
import "../styles/portalAuth.css";

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
    <section className={`portal-auth-page ${role}`}>
      <div className="portal-auth-shell compact">
        <aside className="portal-auth-side">
          <Link to="/" className="portal-back-link">
            <FiArrowLeft />
            Back to landing page
          </Link>

          <div className="portal-auth-side-copy">
            <span>Email verification</span>
            <h1>Confirm your {roleLabel.toLowerCase()} portal access.</h1>
            <p>
              Verification protects the portal account before it can access the
              customer or supplier workspace.
            </p>
          </div>

          <div className="portal-auth-checklist">
            <p>
              <FiShield />
              Verification code required
            </p>
            <p>
              <FiMail />
              Use the email used during registration
            </p>
            <p>
              <FiCheckCircle />
              Redirects to login after success
            </p>
          </div>
        </aside>

        <section className="portal-auth-card">
          <div className="portal-auth-header">
            <div className="portal-auth-icon">
              <FiKey />
            </div>

            <span>{roleLabel} verification</span>
            <h1>Verify email</h1>
            <p>
              Enter the verification code sent to your email. During demo, check
              the backend terminal for the code.
            </p>
          </div>

          {error && <p className="portal-message error">{error}</p>}
          {successMessage && <p className="portal-message success">{successMessage}</p>}

          <form onSubmit={handleSubmit} className="portal-auth-form">
            <div className="portal-form-field">
              <label htmlFor={`${role}-verify-email`}>Email address</label>
              <div className="portal-input-with-icon">
                <FiMail />
                <input
                  id={`${role}-verify-email`}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="portal-form-field">
              <label htmlFor={`${role}-verification-code`}>
                Verification code
              </label>
              <div className="portal-input-with-icon">
                <FiKey />
                <input
                  id={`${role}-verification-code`}
                  name="code"
                  type="text"
                  placeholder="Enter code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="portal-primary-button">
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <div className="portal-auth-footer">
            <p>
              Already verified? <Link to={`/${role}/login`}>Go to login</Link>
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

export default PortalVerifyEmailPage;
