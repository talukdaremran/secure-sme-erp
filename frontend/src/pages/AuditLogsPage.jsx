import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/audit-logs");
      setAuditLogs(response.data.data.auditLogs);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Audit Logs</h1>
        <p>Loading audit logs...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Audit Logs</h1>
        <p>{error}</p>
        <button type="button" onClick={fetchAuditLogs}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Audit Logs</h1>

      {auditLogs.length === 0 ? (
        <p>No audit logs found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Action</th>
              <th>Module</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Result</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.user_name || "-"}</td>
                <td>{log.user_email || "-"}</td>
                <td>{log.action}</td>
                <td>{log.module}</td>
                <td>{log.entity_type || "-"}</td>
                <td>{log.entity_id || "-"}</td>
                <td>{log.result}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default AuditLogsPage;