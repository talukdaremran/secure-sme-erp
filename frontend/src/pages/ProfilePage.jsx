import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiKey,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../styles/profile.css";

function ProfilePage() {
  const { user } = useAuth();

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatLabel(value) {
    if (!value) {
      return "-";
    }

    return String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function getInitials(name) {
    if (!name) {
      return "U";
    }

    const words = name.trim().split(" ").filter(Boolean);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
  }

  if (!user) {
    return (
      <section className="profile-page">
        <div className="profile-state-card">
          <FiUser />
          <h1>Loading profile</h1>
          <p>Preparing account details.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="profile-command-bar">
        <div>
          <span className="profile-eyebrow">Account settings</span>
          <h1>Profile</h1>
          <p>
            Review your CoreFlow user account, access level, and security
            status.
          </p>
        </div>

        <div className="profile-command-actions">
          <Link to="/change-password" className="profile-secondary-button">
            <FiKey />
            Change password
          </Link>
        </div>
      </header>

      <section className="profile-identity-card">
        <div className="profile-avatar-large">{getInitials(user.name)}</div>

        <div className="profile-identity-main">
          <span>Signed-in user</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>

          <div className="profile-badge-row">
            <span className="profile-badge blue">{user.role}</span>
            <span className="profile-badge green">{formatLabel(user.status)}</span>
          </div>
        </div>

        <div className="profile-identity-meta">
          <p>Account created</p>
          <strong>{formatDate(user.created_at)}</strong>
        </div>
      </section>

      <div className="profile-grid">
        <section className="profile-panel profile-details-panel">
          <div className="profile-panel-header">
            <div>
              <span>Account details</span>
              <h2>User information</h2>
            </div>
          </div>

          <div className="profile-detail-list">
            <div className="profile-detail-item">
              <span>
                <FiUser />
              </span>

              <div>
                <p>Name</p>
                <strong>{user.name}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <span>
                <FiMail />
              </span>

              <div>
                <p>Email</p>
                <strong>{user.email}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <span>
                <FiShield />
              </span>

              <div>
                <p>Role</p>
                <strong>{user.role}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <span>
                <FiCheckCircle />
              </span>

              <div>
                <p>Status</p>
                <strong>{formatLabel(user.status)}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <span>
                <FiCalendar />
              </span>

              <div>
                <p>Account created</p>
                <strong>{formatDate(user.created_at)}</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="profile-panel profile-access-panel">
          <div className="profile-panel-header">
            <div>
              <span>Access control</span>
              <h2>Current permissions</h2>
            </div>
          </div>

          <div className="profile-access-summary">
            <div>
              <FiShield />
            </div>

            <h3>{user.role} access</h3>
            <p>
              Your current role controls which CoreFlow modules you can open and
              which business actions you can perform.
            </p>
          </div>

          <div className="profile-access-list">
            <p>
              <FiCheckCircle />
              Authenticated staff account
            </p>
            <p>
              <FiCheckCircle />
              Role-based navigation and API access
            </p>
            <p>
              <FiCheckCircle />
              Actions recorded in audit logs
            </p>
          </div>
        </aside>

        <section className="profile-panel profile-note-card">
          <div className="profile-panel-header">
            <div>
              <span>Security notice</span>
              <h2>Profile management policy</h2>
            </div>
          </div>

          <p>
            Profile editing is disabled in this prototype. In a production ERP
            system, account creation, role changes, and account status updates
            would be controlled by an Admin. This protects accountability because
            important business actions are linked to authenticated user accounts
            through audit logs.
          </p>
        </section>
      </div>
    </section>
  );
}

export default ProfilePage;
