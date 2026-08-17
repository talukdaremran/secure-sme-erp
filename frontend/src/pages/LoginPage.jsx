import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiMail } from "react-icons/fi";
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
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <img src={appIcon} alt="SME ERP logo" />
          </div>

          <div>
            <h1>SME ERP</h1>
            <p>Secure business management portal</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>{isAddAccountMode ? "Add Account" : "Log In"}</h2>
          <p>
            {isAddAccountMode
              ? "Log in with another account to save it for quick switching."
              : "Access your ERP dashboard and business tools."}
          </p>
        </div>

        {isAddAccountMode && (
          <p className="message info-message">
            Admin account switching is intended for testing lower-privilege
            access and reviewing the system from different user roles.
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <FiMail />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-with-icon">
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

          {error && <p className="message error-message">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="primary-button">
            {isSubmitting
              ? isAddAccountMode
                ? "Adding account..."
                : "Logging in..."
              : isAddAccountMode
              ? "Add Account"
              : "Log In"}
          </button>
        </form>

        {isAddAccountMode ? (
          <p className="auth-switch">
            Changed your mind? <Link to="/">Back to app</Link>
          </p>
        ) : (
          <p className="auth-note">
            Accounts are created by an Admin inside the ERP system.
          </p>
        )}
      </section>
    </main>
  );
}

export default LoginPage;