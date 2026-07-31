import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

const roleOptions = ["Admin", "Staff"];

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

  function resetUserFilters() {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortOption("newest");
  }

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

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest User</span>
            <strong>
              {loading
                ? "..."
                : latestUser
                ? formatShortDate(latestUser.created_at)
                : "-"}
            </strong>
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
    </section>
  );
}

export default UsersPage;