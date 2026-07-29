import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const roleOptions = ["Admin", "Staff"];

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});

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
      setUsers(response.data.data.users);
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

      setSuccessMessage("User role updated successfully.");

      await fetchUsers();
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || "Failed to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Users</h1>
        <p>Loading users...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Users</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchUsers}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Users</h1>

      {updateError && <p>{updateError}</p>}
      {successMessage && <p>{successMessage}</p>}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Update Role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>
                  <select
                    value={selectedRoles[user.id] || user.role}
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
                    disabled={updatingUserId === user.id}
                  >
                    {updatingUserId === user.id ? "Updating..." : "Update"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default UsersPage;