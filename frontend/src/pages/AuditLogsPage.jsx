import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import "../styles/auditLogs.css";

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
      return "audit-result-pill result-success";
    }

    if (normalisedResult === "failed" || normalisedResult === "error") {
      return "audit-result-pill result-danger";
    }

    return "audit-result-pill result-warning";
  }

  function getModuleBadgeClass(module) {
    const normalisedModule = String(module || "").toLowerCase();

    if (normalisedModule === "auth") {
      return "audit-module-pill module-auth";
    }

    if (normalisedModule === "users" || normalisedModule === "roles") {
      return "audit-module-pill module-access";
    }

    if (normalisedModule === "products" || normalisedModule === "inventory") {
      return "audit-module-pill module-inventory";
    }

    if (normalisedModule === "sales" || normalisedModule === "sales-orders") {
      return "audit-module-pill module-sales";
    }

    if (normalisedModule === "purchase-orders" || normalisedModule === "suppliers") {
      return "audit-module-pill module-procurement";
    }

    return "audit-module-pill module-default";
  }

  function isHighRiskLog(log) {
    const action = String(log.action || "").toLowerCase();
    const module = String(log.module || "").toLowerCase();
    const result = String(log.result || "").toLowerCase();

    return (
      result === "failed" ||
      result === "error" ||
      module === "users" ||
      module === "roles" ||
      action.includes("delete") ||
      action.includes("role") ||
      action.includes("password") ||
      action.includes("login_failed") ||
      action.includes("failed")
    );
  }

  function getRiskLabel(log) {
    if (isHighRiskLog(log)) {
      return "Review";
    }

    return "Normal";
  }

  function getRiskClass(log) {
    if (isHighRiskLog(log)) {
      return "audit-risk-pill risk-review";
    }

    return "audit-risk-pill risk-normal";
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

  const accessControlLogs = auditLogs.filter((log) => {
    const action = String(log.action || "").toLowerCase();
    const module = String(log.module || "").toLowerCase();

    return (
      module === "users" ||
      module === "roles" ||
      action.includes("role") ||
      action.includes("password")
    );
  });

  const highRiskLogs = auditLogs.filter(isHighRiskLog);

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

  const latestReviewItems = highRiskLogs
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <section className="audit-page">
      <header className="audit-command-bar">
        <div>
          <span className="audit-eyebrow">Security monitor</span>
          <h1>Audit logs</h1>
          <p>
            Review system activity, user actions, affected modules, results, and
            security-sensitive events across CoreFlow.
          </p>
        </div>

        <div className="audit-command-actions">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="audit-secondary-command"
            disabled={loading}
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="audit-message-stack">
          <p className="message error-message">{error}</p>
        </div>
      )}

      <section className="audit-kpi-strip" aria-label="Audit log metrics">
        <article className="audit-kpi-card">
          <div className="audit-kpi-icon">
            <FiActivity />
          </div>

          <div>
            <span>Total logs</span>
            <strong>{loading ? "..." : totalLogs}</strong>
            <p>Recorded events</p>
          </div>
        </article>

        <article className="audit-kpi-card success">
          <div className="audit-kpi-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Successful actions</span>
            <strong>{loading ? "..." : successfulLogs.length}</strong>
            <p>Completed events</p>
          </div>
        </article>

        <article className="audit-kpi-card danger">
          <div className="audit-kpi-icon">
            <FiXCircle />
          </div>

          <div>
            <span>Failed actions</span>
            <strong>{loading ? "..." : failedLogs.length}</strong>
            <p>Needs attention</p>
          </div>
        </article>

        <article className="audit-kpi-card info">
          <div className="audit-kpi-icon">
            <FiShield />
          </div>

          <div>
            <span>Auth events</span>
            <strong>{loading ? "..." : authenticationLogs.length}</strong>
            <p>Login and access</p>
          </div>
        </article>

        <article className="audit-kpi-card warning">
          <div className="audit-kpi-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <span>Review events</span>
            <strong>{loading ? "..." : highRiskLogs.length}</strong>
            <p>Security-sensitive</p>
          </div>
        </article>

        <article className="audit-kpi-card">
          <div className="audit-kpi-icon">
            <FiClock />
          </div>

          <div>
            <span>Latest activity</span>
            <strong>
              {loading
                ? "..."
                : latestLog
                ? formatShortDate(latestLog.created_at)
                : "-"}
            </strong>
            <p>Most recent event</p>
          </div>
        </article>
      </section>

      <section className="audit-overview-grid">
        <article className="audit-review-panel">
          <div className="audit-review-header">
            <div>
              <span>Security review queue</span>
              <h2>Events worth reviewing</h2>
              <p>
                Failed actions, access-control changes, password-related events,
                and delete operations are highlighted for demo visibility.
              </p>
            </div>

            <strong>{accessControlLogs.length}</strong>
          </div>

          {latestReviewItems.length === 0 ? (
            <div className="audit-review-empty">
              <FiShield />
              <p>No review events found in the current audit dataset.</p>
            </div>
          ) : (
            <div className="audit-review-list">
              {latestReviewItems.map((log) => (
                <div className="audit-review-item" key={log.id}>
                  <div>
                    <strong>{formatLabel(log.action)}</strong>
                    <p>
                      {log.user_name || "System / Unknown"} ·{" "}
                      {formatLabel(log.module)}
                    </p>
                  </div>

                  <span className={getResultBadgeClass(log.result)}>
                    {formatLabel(log.result)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="audit-rules-card">
          <span>Audit coverage</span>
          <h2>What this page demonstrates</h2>

          <ul>
            <li>Each business action can be traced back to a user or system event.</li>
            <li>Result, module, entity type, entity ID, and timestamp are visible.</li>
            <li>Security-sensitive activity is easier to find through filters.</li>
          </ul>
        </article>
      </section>

      <section className="audit-workspace">
        <div className="audit-workspace-header">
          <div>
            <span>System activity</span>
            <h2>Audit event register</h2>
            <p>
              {loading
                ? "Loading audit logs..."
                : `Showing ${displayedAuditLogs.length} of ${auditLogs.length} audit logs.`}
            </p>
          </div>
        </div>

        <div className="audit-toolbar">
          <div className="audit-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search user, email, action, module, entity, or result"
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
            <option value="all">All modules</option>
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
            <option value="all">All results</option>
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {hasActiveAuditFilters && (
            <button
              type="button"
              onClick={resetAuditFilters}
              className="audit-secondary-command"
            >
              <FiFilter />
              Reset
            </button>
          )}
        </div>

        <div className="audit-table-area">
          {loading ? (
            <div className="audit-empty-state">
              <FiShield />
              <h3>Loading audit logs</h3>
              <p>Please wait while security events are loaded.</p>
            </div>
          ) : error ? (
            <div className="audit-empty-state">
              <FiAlertTriangle />
              <h3>Could not load audit logs</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="audit-primary-command"
              >
                Try again
              </button>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="audit-empty-state">
              <FiShield />
              <h3>No audit logs found</h3>
              <p>User and system activity will appear here.</p>
            </div>
          ) : displayedAuditLogs.length === 0 ? (
            <div className="audit-empty-state">
              <FiAlertTriangle />
              <h3>No matching audit logs</h3>
              <p>Try changing your search, module filter, or result filter.</p>

              <button
                type="button"
                onClick={resetAuditFilters}
                className="audit-secondary-command"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Result</th>
                    <th>Risk</th>
                    <th>Created at</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedAuditLogs.map((log) => (
                    <tr key={log.id} className={isHighRiskLog(log) ? "audit-review-row" : ""}>
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
                          <span>{log.entity_id ? `ID: ${log.entity_id}` : "-"}</span>
                        </div>
                      </td>

                      <td>
                        <span className={getResultBadgeClass(log.result)}>
                          {formatLabel(log.result)}
                        </span>
                      </td>

                      <td>
                        <span className={getRiskClass(log)}>
                          {getRiskLabel(log)}
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
      </section>
    </section>
  );
}

export default AuditLogsPage;
