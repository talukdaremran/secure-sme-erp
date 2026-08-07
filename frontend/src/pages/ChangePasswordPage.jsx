import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiShield } from "react-icons/fi";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import appIcon from "../assets/favicon.svg";

const initialFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    setSuccessMessage("");

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirmation password do not match.");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiClient.patch("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccessMessage("Password changed successfully. Redirecting...");

      /*
        We use a small full-page reload after password change so AuthContext
        reloads /auth/me and gets must_change_password = false.
      */
      setTimeout(() => {
        window.location.replace(getDefaultRouteForRole(user?.role));
      }, 700);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate("/login");
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
          <h2>Change Password</h2>
          <p>
            Your account was created with a temporary password. Please choose a
            new password before continuing.
          </p>
        </div>

        <p className="message info-message">
          This step protects your account and confirms that only you know your
          new password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="currentPassword">Temporary Password</label>
          <div className="input-with-icon">
            <FiShield />
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Enter temporary password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="newPassword">New Password</label>
          <div className="input-with-icon">
            <FiLock />
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="At least 8 characters"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="input-with-icon">
            <FiLock />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          {error && <p className="message error-message">{error}</p>}

          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button"
          >
            {isSubmitting ? "Changing password..." : "Change Password"}
          </button>
        </form>

        <p className="auth-note">
          After changing your password, you will be redirected into the ERP
          system.
        </p>

        <button
          type="button"
          onClick={handleCancel}
          className="secondary-button"
          disabled={isSubmitting}
        >
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default ChangePasswordPage;