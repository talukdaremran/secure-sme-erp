import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created At</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default UsersPage;