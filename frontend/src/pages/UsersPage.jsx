import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFilter,
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
      return "users-role-pill role-admin";
    }

    return "users-role-pill role-staff";
  }

  function getStatusBadgeClass(status) {
    const normalisedStatus = String(status || "").toLowerCase();

    if (normalisedStatus === "active") {
      return "users-status-pill status-active";
    }

    if (normalisedStatus === "inactive" || normalisedStatus === "disabled") {
      return "users-status-pill status-inactive";
    }

    return "users-status-pill status-pending";
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
      return "users-setup-pill setup-warning";
    }

    if (user.must_change_password) {
      return "users-setup-pill setup-info";
    }

    return "users-setup-pill setup-success";
  }

  const totalUsers = users.length;

  const adminUsers = users.filter((user) => user.role === "Admin");
  const staffUsers = users.filter((user) => user.role === "Staff");

  const activeUsers = users.filter((user) => {
    return String(user.status || "").toLowerCase() === "active";
  });

  const inactiveUsers = users.filter((user) => {
    const status = String(user.status || "").toLowerCase();
    return status === "inactive" || status === "disabled";
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
    <section className="users-page">
      <header className="users-command-bar">
        <div>
          <span className="users-eyebrow">Team access</span>
          <h1>Users</h1>
          <p>
            Create internal staff accounts, review account status, and manage
            Admin or Staff access for the CoreFlow staff portal.
          </p>
        </div>

        <div className="users-command-actions">
          <button
            type="button"
            onClick={fetchUsers}
            className="users-secondary-command"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateUserModal}
            className="users-primary-command"
          >
            <FiPlus />
            Create user
          </button>
        </div>
      </header>

      {(error || updateError || successMessage) && (
        <div className="users-message-stack">
          {error && <p className="message error-message">{error}</p>}
          {updateError && <p className="message error-message">{updateError}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="users-kpi-strip" aria-label="User access metrics">
        <article className="users-kpi-card">
          <div className="users-kpi-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total users</span>
            <strong>{loading ? "..." : totalUsers}</strong>
            <p>Internal accounts</p>
          </div>
        </article>

        <article className="users-kpi-card info">
          <div className="users-kpi-icon">
            <FiShield />
          </div>

          <div>
            <span>Admins</span>
            <strong>{loading ? "..." : adminUsers.length}</strong>
            <p>Privileged access</p>
          </div>
        </article>

        <article className="users-kpi-card success">
          <div className="users-kpi-icon">
            <FiUser />
          </div>

          <div>
            <span>Staff</span>
            <strong>{loading ? "..." : staffUsers.length}</strong>
            <p>Operational access</p>
          </div>
        </article>

        <article className="users-kpi-card success">
          <div className="users-kpi-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>Active users</span>
            <strong>{loading ? "..." : activeUsers.length}</strong>
            <p>Can access system</p>
          </div>
        </article>

        <article className="users-kpi-card warning">
          <div className="users-kpi-icon">
            <FiClock />
          </div>

          <div>
            <span>Never accessed</span>
            <strong>{loading ? "..." : usersNeverLoggedIn.length}</strong>
            <p>Created, not logged in</p>
          </div>
        </article>

        <article className="users-kpi-card danger">
          <div className="users-kpi-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{loading ? "..." : inactiveUsers.length}</strong>
            <p>Disabled accounts</p>
          </div>
        </article>
      </section>

      <section className="users-workspace">
        <div className="users-workspace-header">
          <div>
            <span>Access register</span>
            <h2>User accounts</h2>
            <p>
              {loading
                ? "Loading users..."
                : `Showing ${displayedUsers.length} of ${users.length} users.`}
              {latestUser
                ? ` Latest user: ${formatShortDate(latestUser.created_at)}.`
                : ""}
            </p>
          </div>
        </div>

        <div className="users-toolbar">
          <div className="users-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, role, or status"
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
            <option value="all">All roles</option>
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
            <option value="all">All statuses</option>
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="role-asc">Role A-Z</option>
          </select>

          {hasActiveUserFilters && (
            <button
              type="button"
              onClick={resetUserFilters}
              className="users-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="users-table-area">
          {loading ? (
            <div className="users-empty-state">
              <FiUsers />
              <h3>Loading users</h3>
              <p>Please wait while user access records are loaded.</p>
            </div>
          ) : error ? (
            <div className="users-empty-state">
              <FiAlertTriangle />
              <h3>Could not load users</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchUsers}
                className="users-primary-command"
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="users-empty-state">
              <FiUsers />
              <h3>No users found</h3>
              <p>Create the first internal account using the command bar.</p>

              <button
                type="button"
                onClick={openCreateUserModal}
                className="users-primary-command"
              >
                <FiPlus />
                Create user
              </button>
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="users-empty-state">
              <FiAlertTriangle />
              <h3>No matching users</h3>
              <p>Try changing your search, role filter, or status filter.</p>

              <button
                type="button"
                onClick={resetUserFilters}
                className="users-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current role</th>
                    <th>Status</th>
                    <th>Account setup</th>
                    <th>Last login</th>
                    <th>Created at</th>
                    <th>Update role</th>
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
                              className="users-icon-action"
                            >
                              {updatingUserId === user.id
                                ? "Updating"
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
      </section>

      {isCreateUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card users-create-user-modal">
            <div className="users-modal-header">
              <div>
                <span>Internal account</span>
                <h2>Create user</h2>
                <p>Add a new internal CoreFlow staff account.</p>
              </div>

              <button
                type="button"
                onClick={closeCreateUserModal}
                className="users-icon-button"
                aria-label="Close create user form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="users-form-grid">
              <div className="form-field">
                <label htmlFor="create-name">Full name</label>
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
                <label htmlFor="create-password">Temporary password</label>
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
                <label htmlFor="create-confirm-password">Confirm password</label>
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
                <p className="message error-message users-form-full">
                  {createUserError}
                </p>
              )}

              <p className="users-auth-note users-form-full">
                Create a temporary password and share it with the staff member
                securely. In production, this would be replaced with an
                invitation or password reset flow.
              </p>

              <div className="users-form-actions users-form-full">
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
                  {isCreatingUser ? "Creating..." : "Create user"}
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
