import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShield,
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

function ApprovalsPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin";

  const [products, setProducts] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [reviewNote, setReviewNote] = useState("");

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

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
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
    if (status === "approved") return "badge badge-success";
    if (status === "rejected") return "badge badge-danger";
    return "badge badge-warning";
  }

  function getRequestQuantityChange(request) {
    return Number(request.request_data?.quantity_change || 0);
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

      setReviewNote("");
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

      setReviewNote("");
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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Approvals</h1>
          <p>
            Request inventory adjustments and, for Admin users, review critical stock
            changes before they are applied.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" onClick={fetchPageData} disabled={loading}>
            <FiRefreshCw />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      <section className="panel approval-request-panel">
        <div className="panel-header">
          <h2>Request Inventory Adjustment</h2>
          <p>
            This creates an approval request only. Stock changes after Admin
            approval.
          </p>
        </div>

        <div className="panel-body">
          <form className="form-grid" onSubmit={handleCreateRequest}>
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
              <label htmlFor="quantity_change">Quantity Change</label>
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

            <div className="form-field form-full-width">
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
              <p className="message error-message form-full-width">
                {formError}
              </p>
            )}

            <p className="auth-note form-full-width">
              This request does not directly change stock. Admin approval is
              required before inventory is updated.
            </p>

            <div className="form-actions">
              <button type="submit" disabled={savingRequest}>
                {savingRequest ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {isAdmin && (
        <section className="table-card">
          <div className="table-card-header">
            <div>
              <h2>Approval Requests</h2>
              <p>
                {loading
                  ? "Loading approval requests..."
                  : `${pendingRequests.length} pending request(s).`}
              </p>
            </div>
          </div>

          <div className="panel-body">
            {loading ? (
              <p>Loading approval requests...</p>
            ) : approvalRequests.length === 0 ? (
              <div className="empty-state">
                <FiShield />
                <h3>No approval requests</h3>
                <p>Inventory adjustment requests will appear here.</p>
              </div>
            ) : (
              <>
                <div className="approval-review-box">
                  <label htmlFor="review_note">Review Note</label>
                  <textarea
                    id="review_note"
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Optional for approval, required for rejection"
                    rows="3"
                  />
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Product</th>
                        <th>Quantity Change</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Requested By</th>
                        <th>Requested At</th>
                        <th>Reviewed By</th>
                        <th>Reviewed At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {approvalRequests.map((request) => {
                        const quantityChange = getRequestQuantityChange(request);

                        return (
                          <tr key={request.id}>
                            <td>
                              <strong>REQ-{String(request.id).padStart(4, "0")}</strong>
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
                              <span
                                className={
                                  quantityChange > 0
                                    ? "stock-change-positive"
                                    : "stock-change-negative"
                                }
                              >
                                {quantityChange > 0 ? "+" : ""}
                                {quantityChange}
                              </span>
                            </td>

                            <td>{request.reason}</td>

                            <td>
                              <span className={getStatusBadgeClass(request.status)}>
                                {formatLabel(request.status)}
                              </span>
                            </td>

                            <td>{request.requested_by_name || "-"}</td>
                            <td>{formatDate(request.created_at)}</td>
                            <td>{request.reviewed_by_name || "-"}</td>
                            <td>{formatDate(request.reviewed_at)}</td>

                            <td>
                              {request.status === "pending" ? (
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="success-button"
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
                                    className="danger-button"
                                    onClick={() => handleRejectRequest(request.id)}
                                    disabled={reviewingRequestId === request.id}
                                  >
                                    <FiXCircle />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="table-subtext">
                                  Reviewed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

export default ApprovalsPage;