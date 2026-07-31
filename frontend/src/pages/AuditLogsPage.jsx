import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/audit-logs");
      setAuditLogs(response.data?.data?.auditLogs || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
  }, []);

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

  function getResultBadgeClass(result) {
    const normalisedResult = String(result || "").toLowerCase();

    if (normalisedResult === "success") {
      return "badge badge-success";
    }

    if (normalisedResult === "failed" || normalisedResult === "error") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  function getModuleBadgeClass(module) {
    const normalisedModule = String(module || "").toLowerCase();

    if (normalisedModule === "auth") {
      return "badge badge-info";
    }

    if (normalisedModule === "products" || normalisedModule === "inventory") {
      return "badge badge-success";
    }

    if (normalisedModule === "sales" || normalisedModule === "sales-orders") {
      return "badge badge-warning";
    }

    return "badge badge-info";
  }

  const totalLogs = auditLogs.length;

  const successfulLogs = auditLogs.filter((log) => {
    return String(log.result || "").toLowerCase() === "success";
  });

  const failedLogs = auditLogs.filter((log) => {
    return String(log.result || "").toLowerCase() !== "success";
  });

  const authenticationLogs = auditLogs.filter((log) => {
    const action = String(log.action || "").toLowerCase();
    const module = String(log.module || "").toLowerCase();

    return (
      module === "auth" ||
      action.includes("login") ||
      action.includes("register")
    );
  });

  const latestLog = [...auditLogs].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  const moduleOptions = [
    ...new Set(auditLogs.map((log) => log.module).filter(Boolean)),
  ].sort();

  const resultOptions = [
    ...new Set(auditLogs.map((log) => log.result).filter(Boolean)),
  ].sort();

  const displayedAuditLogs = auditLogs
    .filter((log) => {
      const searchableText = `${log.user_name || ""} ${log.user_email || ""} ${
        log.action || ""
      } ${log.module || ""} ${log.entity_type || ""} ${
        log.entity_id || ""
      } ${log.result || ""}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesModule =
        moduleFilter === "all" || log.module === moduleFilter;
      const matchesResult =
        resultFilter === "all" || log.result === resultFilter;

      return matchesSearch && matchesModule && matchesResult;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      return 0;
    });

  const hasActiveAuditFilters =
    searchQuery || moduleFilter !== "all" || resultFilter !== "all";

  function resetAuditFilters() {
    setSearchQuery("");
    setModuleFilter("all");
    setResultFilter("all");
    setSortOption("newest");
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            Review system activity, user actions, affected modules, and action
            results.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="secondary-button"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}

      <div className="dashboard-metric-grid">
        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiActivity />
          </div>

          <div>
            <span>Total Logs</span>
            <strong>{loading ? "..." : totalLogs}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Successful Actions</span>
            <strong>{loading ? "..." : successfulLogs.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-red">
          <div className="metric-icon">
            <FiXCircle />
          </div>

          <div>
            <span>Failed Actions</span>
            <strong>{loading ? "..." : failedLogs.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-purple">
          <div className="metric-icon">
            <FiShield />
          </div>

          <div>
            <span>Auth Actions</span>
            <strong>{loading ? "..." : authenticationLogs.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest Activity</span>
            <strong>
              {loading
                ? "..."
                : latestLog
                ? formatShortDate(latestLog.created_at)
                : "-"}
            </strong>
          </div>
        </article>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>System Activity</h2>
            <p>
              {loading
                ? "Loading audit logs..."
                : `Showing ${displayedAuditLogs.length} of ${auditLogs.length} audit logs.`}
            </p>
          </div>
        </div>

        <div className="table-toolbar audit-table-toolbar">
          <div className="toolbar-input-with-icon">
            <FiSearch />
            <input
              type="text"
              placeholder="Search user, email, action, module, entity, or result..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search audit logs"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            aria-label="Filter audit logs by module"
          >
            <option value="all">All Modules</option>
            {moduleOptions.map((module) => (
              <option key={module} value={module}>
                {formatLabel(module)}
              </option>
            ))}
          </select>

          <select
            value={resultFilter}
            onChange={(event) => setResultFilter(event.target.value)}
            aria-label="Filter audit logs by result"
          >
            <option value="all">All Results</option>
            {resultOptions.map((result) => (
              <option key={result} value={result}>
                {formatLabel(result)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            aria-label="Sort audit logs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasActiveAuditFilters && (
            <button
              type="button"
              onClick={resetAuditFilters}
              className="secondary-button"
            >
              Reset
            </button>
          )}
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading audit logs...</p>
          ) : error ? (
            <div>
              <p className="message error-message">{error}</p>

              <button type="button" onClick={fetchAuditLogs}>
                Try Again
              </button>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state">
              <FiShield />
              <h3>No audit logs found</h3>
              <p>User and system activity will appear here.</p>
            </div>
          ) : displayedAuditLogs.length === 0 ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>No matching audit logs found</h3>
              <p>Try changing your search, module filter, or result filter.</p>

              <button
                type="button"
                onClick={resetAuditFilters}
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
                    <th>Action</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Result</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="audit-user-cell">
                          <span className="audit-user-icon">
                            <FiUser />
                          </span>

                          <strong>{log.user_name || "System / Unknown"}</strong>
                        </div>
                      </td>

                      <td>{log.user_email || "-"}</td>

                      <td>
                        <strong className="audit-action-text">
                          {formatLabel(log.action)}
                        </strong>
                      </td>

                      <td>
                        <span className={getModuleBadgeClass(log.module)}>
                          {formatLabel(log.module)}
                        </span>
                      </td>

                      <td>
                        <div className="audit-entity-cell">
                          <strong>{formatLabel(log.entity_type)}</strong>
                          <span>
                            {log.entity_id ? `ID: ${log.entity_id}` : "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={getResultBadgeClass(log.result)}>
                          {formatLabel(log.result)}
                        </span>
                      </td>

                      <td>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AuditLogsPage;