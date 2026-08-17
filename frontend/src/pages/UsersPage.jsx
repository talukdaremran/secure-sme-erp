import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import "../styles/users.css";

const roleOptions = ["Admin", "Staff"];
const initialCreateUserForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "Staff",
};

function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState(initialCreateUserForm);
  const [createUserError, setCreateUserError] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/users");
      setUsers(response.data?.data?.users || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleRoleChange(userId, role) {
    setSelectedRoles((previousRoles) => ({
      ...previousRoles,
      [userId]: role,
    }));
  }

  async function handleUpdateRole(user) {
    const selectedRole = selectedRoles[user.id] || user.role;

    try {
      setUpdatingUserId(user.id);
      setUpdateError("");
      setSuccessMessage("");

      await apiClient.patch(`/users/${user.id}/role`, {
        role: selectedRole,
      });

      setSuccessMessage(`${user.name}'s role updated successfully.`);

      setSelectedRoles((previousRoles) => {
        const updatedRoles = { ...previousRoles };
        delete updatedRoles[user.id];
        return updatedRoles;
      });

      await fetchUsers();
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || "Failed to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
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

  function getRoleBadgeClass(role) {
    if (role === "Admin") {
      return "badge badge-info";
    }

    return "badge badge-success";
  }

  function getStatusBadgeClass(status) {
    const normalisedStatus = String(status || "").toLowerCase();

    if (normalisedStatus === "active") {
      return "badge badge-success";
    }

    if (normalisedStatus === "inactive" || normalisedStatus === "disabled") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  function openCreateUserModal() {
    setCreateUserError("");
    setCreateUserForm(initialCreateUserForm);
    setIsCreateUserModalOpen(true);
  }

  function closeCreateUserModal() {
    setIsCreateUserModalOpen(false);
    setCreateUserError("");
    setCreateUserForm(initialCreateUserForm);
  }

  function handleCreateUserChange(event) {
    const { name, value } = event.target;

    setCreateUserForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleCreateUserSubmit(event) {
    event.preventDefault();

    setCreateUserError("");
    setUpdateError("");
    setSuccessMessage("");

    if (createUserForm.password !== createUserForm.confirmPassword) {
      setCreateUserError("Passwords do not match.");
      return;
    }

    try {
      setIsCreatingUser(true);

      await apiClient.post("/users", {
        name: createUserForm.name,
        email: createUserForm.email,
        password: createUserForm.password,
        role: createUserForm.role,
      });

      setSuccessMessage(`${createUserForm.name} was created successfully.`);
      closeCreateUserModal();
      await fetchUsers();
    } catch (error) {
      setCreateUserError(
        error.response?.data?.message || "Failed to create user."
      );
    } finally {
      setIsCreatingUser(false);
    }
  }

  function resetUserFilters() {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortOption("newest");
  }

  function getAccountSetupLabel(user) {
    if (!user.last_login_at) {
      return "Not accessed";
    }

    if (user.must_change_password) {
      return "Password change required";
    }

    return "Setup complete";
  }

  function getAccountSetupBadgeClass(user) {
    if (!user.last_login_at) {
      return "badge badge-warning";
    }

    if (user.must_change_password) {
      return "badge badge-info";
    }

    return "badge badge-success";
  }

  const totalUsers = users.length;

  const adminUsers = users.filter((user) => user.role === "Admin");
  const staffUsers = users.filter((user) => user.role === "Staff");

  const activeUsers = users.filter((user) => {
    return String(user.status || "").toLowerCase() === "active";
  });

  const latestUser = [...users].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  const statusOptions = [
    ...new Set(users.map((user) => user.status).filter(Boolean)),
  ].sort();

  const displayedUsers = users
    .filter((user) => {
      const searchableText = `${user.name || ""} ${user.email || ""} ${
        user.role || ""
      } ${user.status || ""}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortOption === "name-asc") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortOption === "name-desc") {
        return String(b.name || "").localeCompare(String(a.name || ""));
      }

      if (sortOption === "role-asc") {
        return String(a.role || "").localeCompare(String(b.role || ""));
      }

      return 0;
    });

  const hasActiveUserFilters =
    searchQuery || roleFilter !== "all" || statusFilter !== "all";

  const usersNeverLoggedIn = users.filter((user) => !user.last_login_at);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>
            View system users, monitor account status, and manage user roles.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={openCreateUserModal}
            className="primary-button"
          >
            <FiPlus />
            Create User
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            className="secondary-button"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}
      {updateError && <p className="message error-message">{updateError}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      <div className="dashboard-metric-grid">
        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total Users</span>
            <strong>{loading ? "..." : totalUsers}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-purple">
          <div className="metric-icon">
            <FiShield />
          </div>

          <div>
            <span>Admin Users</span>
            <strong>{loading ? "..." : adminUsers.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiUser />
          </div>

          <div>
            <span>Staff Users</span>
            <strong>{loading ? "..." : staffUsers.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>Active Users</span>
            <strong>{loading ? "..." : activeUsers.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Never Accessed</span>
            <strong>{loading ? "..." : usersNeverLoggedIn.length}</strong>
          </div>
        </article>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>User Accounts</h2>
            <p>
              {loading
                ? "Loading users..."
                : `Showing ${displayedUsers.length} of ${users.length} users.`}
            </p>
          </div>
        </div>

        <div className="table-toolbar users-table-toolbar">
          <div className="toolbar-input-with-icon">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, role, or status..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search users"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter users by role"
          >
            <option value="all">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter users by status"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort users"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="role-asc">Role A-Z</option>
          </select>

          {hasActiveUserFilters && (
            <button
              type="button"
              onClick={resetUserFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading users...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchUsers}>
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <FiUsers />
              <h3>No users found</h3>
              <p>Registered users will appear here.</p>
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>No matching users found</h3>
              <p>Try changing your search, role filter, or status filter.</p>

              <button
                type="button"
                onClick={resetUserFilters}
                className="secondary-button"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th>Account Setup</th>
                    <th>Last Login</th>
                    <th>Created At</th>
                    <th>Update Role</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedUsers.map((user) => {
                    const selectedRole = selectedRoles[user.id] || user.role;
                    const roleUnchanged = selectedRole === user.role;
                    const isCurrentUser = currentUser?.id === user.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="user-account-cell">
                            <span className="user-account-avatar">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>

                            <div>
                              <strong>{user.name}</strong>

                              {isCurrentUser && <span>You</span>}
                            </div>
                          </div>
                        </td>

                        <td>{user.email}</td>

                        <td>
                          <span className={getRoleBadgeClass(user.role)}>
                            {user.role}
                          </span>
                        </td>

                        <td>
                          <span className={getStatusBadgeClass(user.status)}>
                            {formatLabel(user.status)}
                          </span>
                        </td>

                        <td>
                          <span className={getAccountSetupBadgeClass(user)}>
                            {getAccountSetupLabel(user)}
                          </span>
                        </td>

                        <td>{formatDate(user.last_login_at)}</td>

                        <td>{formatDate(user.created_at)}</td>

                        <td>
                          <div className="role-update-control">
                            <select
                              value={selectedRole}
                              onChange={(event) =>
                                handleRoleChange(user.id, event.target.value)
                              }
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUpdateRole(user)}
                              disabled={
                                updatingUserId === user.id || roleUnchanged
                              }
                            >
                              {updatingUserId === user.id
                                ? "Updating..."
                                : "Update"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isCreateUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card create-user-modal">
            <div className="modal-header">
              <div>
                <h2>Create User</h2>
                <p>Add a new internal ERP account.</p>
              </div>

              <button
                type="button"
                onClick={closeCreateUserModal}
                className="icon-button"
                aria-label="Close create user form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="form-grid">
              <div className="form-field">
                <label htmlFor="create-name">Full Name</label>
                <input
                  id="create-name"
                  name="name"
                  type="text"
                  value={createUserForm.name}
                  onChange={handleCreateUserChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="create-email">Email</label>
                <input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={handleCreateUserChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="create-role">Role</label>
                <select
                  id="create-role"
                  name="role"
                  value={createUserForm.role}
                  onChange={handleCreateUserChange}
                  required
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="create-password">Temporary Password</label>
                <input
                  id="create-password"
                  name="password"
                  type="password"
                  value={createUserForm.password}
                  onChange={handleCreateUserChange}
                  placeholder="At least 8 characters"
                  minLength="8"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="create-confirm-password">Confirm Password</label>
                <input
                  id="create-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={createUserForm.confirmPassword}
                  onChange={handleCreateUserChange}
                  placeholder="Confirm password"
                  minLength="8"
                  required
                />
              </div>

              {createUserError && (
                <p className="message error-message form-full-width">
                  {createUserError}
                </p>
              )}

              <p className="auth-note form-full-width">
                Create a temporary password and share it with the staff member
                securely. In production, this would be replaced with an invitation or
                password reset flow.
              </p>

              <div className="modal-actions form-full-width">
                <button
                  type="button"
                  onClick={closeCreateUserModal}
                  className="secondary-button"
                  disabled={isCreatingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default UsersPage;