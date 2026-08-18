import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBarChart2,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import appIcon from "../assets/favicon.svg";
import "../styles/auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { login } = useAuth();

  const isAddAccountMode = searchParams.get("mode") === "add-account";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function getDefaultRouteForRole(role) {
    return role === "Admin" ? "/dashboard" : "/products";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(formData.email, formData.password);

      if (loggedInUser.must_change_password) {
        navigate("/change-password");
        return;
      }

      navigate(getDefaultRouteForRole(loggedInUser.role));
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-hero-panel">
          <Link to="/" className="auth-back-link">
            <FiArrowLeft />
            CoreFlow home
          </Link>

          <div className="auth-brand">
            <div className="auth-logo">
              <img src={appIcon} alt="CoreFlow logo" />
            </div>

            <div>
              <h1>CoreFlow</h1>
              <p>Operations Platform</p>
            </div>
          </div>

          <div className="auth-hero-copy">
            <span>Staff workspace</span>
            <h2>Secure access for business operations.</h2>
            <p>
              Sign in to manage products, sales fulfilment, procurement,
              approvals, audit logs, and business intelligence.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-card">
              <FiShield />
              <div>
                <strong>Role-based access</strong>
                <p>Admin and staff permissions are separated clearly.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <FiBarChart2 />
              <div>
                <strong>BI dashboard</strong>
                <p>Monitor revenue, stock risk, forecast, and activity.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <FiUsers />
              <div>
                <strong>Controlled users</strong>
                <p>Accounts are created internally by an administrator.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card-header">
            <span>{isAddAccountMode ? "Account switch" : "Staff sign in"}</span>
            <h2>{isAddAccountMode ? "Add another account" : "Welcome back"}</h2>
            <p>
              {isAddAccountMode
                ? "Log in with another account to save it for quick switching."
                : "Use your internal CoreFlow account to continue."}
            </p>
          </div>

          {isAddAccountMode && (
            <p className="auth-message info">
              Admin account switching is intended for testing lower-privilege
              access and reviewing the system from different user roles.
            </p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-with-icon">
                <FiMail />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@coreflow.test"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-with-icon">
                <FiLock />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && <p className="auth-message error">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="auth-primary-button">
              {isSubmitting
                ? isAddAccountMode
                  ? "Adding account..."
                  : "Signing in..."
                : isAddAccountMode
                ? "Add account"
                : "Sign in"}
            </button>
          </form>

          {isAddAccountMode ? (
            <p className="auth-footer-note">
              Changed your mind? <Link to="/">Back to app</Link>
            </p>
          ) : (
            <p className="auth-admin-note">
              <FiLock />
              Accounts are created by an Admin inside CoreFlow.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default LoginPage;
