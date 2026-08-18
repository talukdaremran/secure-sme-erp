import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiXCircle,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import "../styles/approvals.css";

const initialFormData = {
  product_id: "",
  quantity_change: "",
  reason: "",
};

const approvalStatusOptions = ["pending", "approved", "rejected"];

function ApprovalsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin";

  const [products, setProducts] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [reviewNotes, setReviewNotes] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchPageData() {
    try {
      setLoading(true);
      setError("");

      const productsResponse = await apiClient.get("/products");
      setProducts(productsResponse.data?.data?.products || []);

      if (isAdmin) {
        const approvalsResponse = await apiClient.get("/approvals");
        setApprovalRequests(
          approvalsResponse.data?.data?.approvalRequests || []
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load approval workflow."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPageData();
  }, [isAdmin]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleReviewNoteChange(requestId, value) {
    setReviewNotes((previousNotes) => ({
      ...previousNotes,
      [requestId]: value,
    }));
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  }

  function formatLabel(value) {
    if (!value) return "-";

    return String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function getStatusBadgeClass(status) {
    if (status === "approved") return "approval-status-pill status-approved";
    if (status === "rejected") return "approval-status-pill status-rejected";
    return "approval-status-pill status-pending";
  }

  function getRequestQuantityChange(request) {
    return Number(request.request_data?.quantity_change || 0);
  }

  function getStockImpactClass(quantityChange) {
    if (quantityChange > 0) {
      return "stock-change-positive";
    }

    return "stock-change-negative";
  }

  function getRiskLabel(request) {
    const quantityChange = Math.abs(getRequestQuantityChange(request));

    if (request.status !== "pending") {
      return "Reviewed";
    }

    if (quantityChange >= 20) {
      return "High impact";
    }

    if (quantityChange >= 10) {
      return "Medium impact";
    }

    return "Standard";
  }

  function getRiskBadgeClass(request) {
    const quantityChange = Math.abs(getRequestQuantityChange(request));

    if (request.status !== "pending") {
      return "approval-risk-pill risk-reviewed";
    }

    if (quantityChange >= 20) {
      return "approval-risk-pill risk-high";
    }

    if (quantityChange >= 10) {
      return "approval-risk-pill risk-medium";
    }

    return "approval-risk-pill risk-standard";
  }

  async function handleCreateRequest(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!formData.product_id) {
      setFormError("Product is required.");
      return;
    }

    if (!Number.isInteger(Number(formData.quantity_change))) {
      setFormError("Quantity change must be a whole number.");
      return;
    }

    if (Number(formData.quantity_change) === 0) {
      setFormError("Quantity change cannot be zero.");
      return;
    }

    if (!formData.reason.trim()) {
      setFormError("Reason is required.");
      return;
    }

    try {
      setSavingRequest(true);

      await apiClient.post("/approvals/inventory-adjustments", {
        product_id: Number(formData.product_id),
        quantity_change: Number(formData.quantity_change),
        reason: formData.reason.trim(),
      });

      setSuccessMessage(
        "Inventory adjustment request created successfully. Stock has not changed yet."
      );

      setFormData(initialFormData);

      if (isAdmin) {
        await fetchPageData();
      }
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "Failed to create inventory adjustment request."
      );
    } finally {
      setSavingRequest(false);
    }
  }

  async function handleApproveRequest(requestId) {
    const reviewNote = reviewNotes[requestId] || "";

    try {
      setReviewingRequestId(requestId);
      setError("");
      setSuccessMessage("");

      await apiClient.patch(`/approvals/${requestId}/approve`, {
        review_note: reviewNote || null,
      });

      setSuccessMessage(
        "Approval request approved successfully. Product stock has been updated."
      );

      setReviewNotes((previousNotes) => {
        const updatedNotes = { ...previousNotes };
        delete updatedNotes[requestId];
        return updatedNotes;
      });

      await fetchPageData();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to approve approval request."
      );
    } finally {
      setReviewingRequestId(null);
    }
  }

  async function handleRejectRequest(requestId) {
    const reviewNote = reviewNotes[requestId] || "";

    if (!reviewNote.trim()) {
      setError("Review note is required when rejecting a request.");
      return;
    }

    try {
      setReviewingRequestId(requestId);
      setError("");
      setSuccessMessage("");

      await apiClient.patch(`/approvals/${requestId}/reject`, {
        review_note: reviewNote.trim(),
      });

      setSuccessMessage("Approval request rejected successfully.");

      setReviewNotes((previousNotes) => {
        const updatedNotes = { ...previousNotes };
        delete updatedNotes[requestId];
        return updatedNotes;
      });

      await fetchPageData();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to reject approval request."
      );
    } finally {
      setReviewingRequestId(null);
    }
  }

  const pendingRequests = approvalRequests.filter(
    (request) => request.status === "pending"
  );

  const approvedRequests = approvalRequests.filter(
    (request) => request.status === "approved"
  );

  const rejectedRequests = approvalRequests.filter(
    (request) => request.status === "rejected"
  );

  const positiveRequests = approvalRequests.filter((request) => {
    return getRequestQuantityChange(request) > 0;
  });

  const negativeRequests = approvalRequests.filter((request) => {
    return getRequestQuantityChange(request) < 0;
  });

  const netStockImpact = approvalRequests.reduce((total, request) => {
    return total + getRequestQuantityChange(request);
  }, 0);

  const latestRequest = [...approvalRequests].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];

  const displayedApprovalRequests = approvalRequests
    .filter((request) => {
      const searchableText = `${request.id || ""} ${request.action_type || ""} ${
        request.product_name || ""
      } ${request.product_sku || ""} ${request.reason || ""} ${
        request.status || ""
      } ${request.requested_by_name || ""} ${
        request.reviewed_by_name || ""
      }`.toLowerCase();

      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortOption === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortOption === "impact-desc") {
        return (
          Math.abs(getRequestQuantityChange(b)) -
          Math.abs(getRequestQuantityChange(a))
        );
      }

      if (sortOption === "impact-asc") {
        return (
          Math.abs(getRequestQuantityChange(a)) -
          Math.abs(getRequestQuantityChange(b))
        );
      }

      return 0;
    });

  const hasActiveApprovalFilters = searchQuery || statusFilter !== "all";

  function resetApprovalFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("newest");
  }

  return (
    <section className="approvals-page">
      <header className="approvals-command-bar">
        <div>
          <span className="approvals-eyebrow">Control centre</span>
          <h1>Approvals</h1>
          <p>
            Request inventory adjustments and, for Admin users, review critical
            stock changes before they are applied to inventory.
          </p>
        </div>

        <div className="approvals-command-actions">
          <button
            type="button"
            onClick={fetchPageData}
            disabled={loading}
            className="approvals-secondary-command"
          >
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {(error || successMessage) && (
        <div className="approvals-message-stack">
          {error && <p className="message error-message">{error}</p>}
          {successMessage && (
            <p className="message success-message">{successMessage}</p>
          )}
        </div>
      )}

      <section className="approval-request-panel">
        <div className="approval-request-copy">
          <span>Inventory adjustment request</span>
          <h2>Request controlled stock change</h2>
          <p>
            Use this form when stock needs to be adjusted manually. The request
            is recorded first and stock changes only after Admin approval.
          </p>
        </div>

        <form className="approval-request-form" onSubmit={handleCreateRequest}>
          <div className="form-field">
            <label htmlFor="product_id">Product</label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleFormChange}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) — Stock:{" "}
                  {product.stock_quantity}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="quantity_change">Quantity change</label>
            <input
              id="quantity_change"
              name="quantity_change"
              type="number"
              value={formData.quantity_change}
              onChange={handleFormChange}
              placeholder="Example: 5 or -3"
              required
            />
          </div>

          <div className="form-field approval-form-full">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              rows="3"
              placeholder="Explain why this stock adjustment is needed"
              required
            />
          </div>

          {formError && (
            <p className="message error-message approval-form-full">
              {formError}
            </p>
          )}

          <p className="approval-auth-note approval-form-full">
            This request does not directly change stock. Admin approval is
            required before inventory is updated.
          </p>

          <div className="approval-form-actions approval-form-full">
            <button type="submit" disabled={savingRequest}>
              {savingRequest ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </section>

      {isAdmin && (
        <>
          <section className="approvals-kpi-strip" aria-label="Approval metrics">
            <article className="approvals-kpi-card warning">
              <div className="approvals-kpi-icon">
                <FiClock />
              </div>

              <div>
                <span>Pending</span>
                <strong>{loading ? "..." : pendingRequests.length}</strong>
                <p>Awaiting decision</p>
              </div>
            </article>

            <article className="approvals-kpi-card success">
              <div className="approvals-kpi-icon">
                <FiCheckCircle />
              </div>

              <div>
                <span>Approved</span>
                <strong>{loading ? "..." : approvedRequests.length}</strong>
                <p>Applied to stock</p>
              </div>
            </article>

            <article className="approvals-kpi-card danger">
              <div className="approvals-kpi-icon">
                <FiXCircle />
              </div>

              <div>
                <span>Rejected</span>
                <strong>{loading ? "..." : rejectedRequests.length}</strong>
                <p>Not applied</p>
              </div>
            </article>

            <article className="approvals-kpi-card">
              <div className="approvals-kpi-icon">
                <FiTrendingUp />
              </div>

              <div>
                <span>Increase requests</span>
                <strong>{loading ? "..." : positiveRequests.length}</strong>
                <p>Positive stock changes</p>
              </div>
            </article>

            <article className="approvals-kpi-card">
              <div className="approvals-kpi-icon">
                <FiTrendingDown />
              </div>

              <div>
                <span>Decrease requests</span>
                <strong>{loading ? "..." : negativeRequests.length}</strong>
                <p>Negative stock changes</p>
              </div>
            </article>

            <article className="approvals-kpi-card">
              <div className="approvals-kpi-icon">
                <FiPackage />
              </div>

              <div>
                <span>Net stock impact</span>
                <strong>
                  {loading ? "..." : `${netStockImpact > 0 ? "+" : ""}${netStockImpact}`}
                </strong>
                <p>
                  {latestRequest
                    ? `Latest: ${formatShortDate(latestRequest.created_at)}`
                    : "No requests yet"}
                </p>
              </div>
            </article>
          </section>

          <section className="approvals-workspace">
            <div className="approvals-workspace-header">
              <div>
                <span>Approval queue</span>
                <h2>Inventory adjustment requests</h2>
                <p>
                  {loading
                    ? "Loading approval requests..."
                    : `Showing ${displayedApprovalRequests.length} of ${approvalRequests.length} requests. ${pendingRequests.length} pending.`}
                </p>
              </div>
            </div>

            <div className="approvals-toolbar">
              <div className="approvals-search-field">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search request, product, reason, status, or user"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search approval requests"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter approval requests by status"
              >
                <option value="all">All statuses</option>
                {approvalStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>

              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                aria-label="Sort approval requests"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="impact-desc">Impact high-low</option>
                <option value="impact-asc">Impact low-high</option>
              </select>

              {hasActiveApprovalFilters && (
                <button
                  type="button"
                  onClick={resetApprovalFilters}
                  className="approvals-secondary-command"
                >
                  <FiFilter />
                  Reset
                </button>
              )}
            </div>

            <div className="approvals-table-area">
              {loading ? (
                <div className="approvals-empty-state">
                  <FiShield />
                  <h3>Loading approval requests</h3>
                  <p>Please wait while approval data is loaded.</p>
                </div>
              ) : approvalRequests.length === 0 ? (
                <div className="approvals-empty-state">
                  <FiShield />
                  <h3>No approval requests</h3>
                  <p>Inventory adjustment requests will appear here.</p>
                </div>
              ) : displayedApprovalRequests.length === 0 ? (
                <div className="approvals-empty-state">
                  <FiAlertTriangle />
                  <h3>No matching requests</h3>
                  <p>Try changing your search, status filter, or sort option.</p>

                  <button
                    type="button"
                    onClick={resetApprovalFilters}
                    className="approvals-secondary-command"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="approvals-table-wrapper">
                  <table className="approvals-table">
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Product</th>
                        <th>Quantity change</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Risk</th>
                        <th>Requested by</th>
                        <th>Reviewed</th>
                        <th>Decision</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayedApprovalRequests.map((request) => {
                        const quantityChange = getRequestQuantityChange(request);
                        const reviewNote = reviewNotes[request.id] || "";

                        return (
                          <tr key={request.id}>
                            <td>
                              <strong className="approval-code">
                                REQ-{String(request.id).padStart(4, "0")}
                              </strong>
                              <p className="table-subtext">
                                {formatLabel(request.action_type)}
                              </p>
                            </td>

                            <td>
                              <strong>{request.product_name || "-"}</strong>
                              <p className="table-subtext">
                                {request.product_sku || "-"} · Current stock:{" "}
                                {request.current_stock_quantity ?? "-"}
                              </p>
                            </td>

                            <td>
                              <span className={getStockImpactClass(quantityChange)}>
                                {quantityChange > 0 ? "+" : ""}
                                {quantityChange}
                              </span>
                            </td>

                            <td>
                              <p className="approval-reason">{request.reason}</p>
                            </td>

                            <td>
                              <span className={getStatusBadgeClass(request.status)}>
                                {formatLabel(request.status)}
                              </span>
                            </td>

                            <td>
                              <span className={getRiskBadgeClass(request)}>
                                {getRiskLabel(request)}
                              </span>
                            </td>

                            <td>
                              <strong>{request.requested_by_name || "-"}</strong>
                              <p className="table-subtext">
                                {formatDate(request.created_at)}
                              </p>
                            </td>

                            <td>
                              <strong>{request.reviewed_by_name || "-"}</strong>
                              <p className="table-subtext">
                                {formatDate(request.reviewed_at)}
                              </p>
                            </td>

                            <td>
                              {request.status === "pending" ? (
                                <div className="approval-decision-box">
                                  <textarea
                                    value={reviewNote}
                                    onChange={(event) =>
                                      handleReviewNoteChange(
                                        request.id,
                                        event.target.value
                                      )
                                    }
                                    placeholder="Review note. Required for rejection."
                                    rows="2"
                                  />

                                  <div className="approval-decision-actions">
                                    <button
                                      type="button"
                                      className="approval-approve-button"
                                      onClick={() =>
                                        handleApproveRequest(request.id)
                                      }
                                      disabled={reviewingRequestId === request.id}
                                    >
                                      <FiCheckCircle />
                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      className="approval-reject-button"
                                      onClick={() => handleRejectRequest(request.id)}
                                      disabled={reviewingRequestId === request.id}
                                    >
                                      <FiXCircle />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="table-subtext">Reviewed</span>
                              )}
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
        </>
      )}
    </section>
  );
}

export default ApprovalsPage;
