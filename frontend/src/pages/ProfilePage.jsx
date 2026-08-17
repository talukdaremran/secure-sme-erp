import {
  FiCalendar,
  FiCheckCircle,
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

  if (!user) {
    return (
      <section>
        <h1>Profile</h1>
        <p>Loading profile...</p>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>View your account details and current ERP access level.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="panel profile-summary-card">
          <div className="profile-avatar-large">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>

            <div className="profile-badge-row">
              <span className="badge badge-info">{user.role}</span>
              <span className="badge badge-success">
                {formatLabel(user.status)}
              </span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Account Details</h2>
            <p>
              These details are linked to your authenticated ERP user account.
            </p>
          </div>

          <div className="panel-body profile-detail-list">
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
                <p>Account Created</p>
                <strong>{formatDate(user.created_at)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel profile-note-card">
          <div className="panel-header">
            <h2>Access Notice</h2>
            <p>Profile editing is not enabled in this prototype version.</p>
          </div>

          <div className="panel-body">
            <p>
              In a production ERP system, account creation and role changes
              would be controlled by an Admin. This supports accountability
              because important business actions are linked to authenticated
              user accounts through audit logs.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

export default ProfilePage;