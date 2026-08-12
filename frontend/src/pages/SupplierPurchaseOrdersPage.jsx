import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiTruck,
  FiX,
} from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";

function SupplierPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);

  const [deliveryNote, setDeliveryNote] = useState("");
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchPurchaseOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await portalApiClient.get(
        "/supplier-portal/purchase-orders"
      );

      setPurchaseOrders(response.data?.data?.purchaseOrders || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load purchase orders."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleViewPurchaseOrder(orderId) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedPurchaseOrder(null);
      setDeliveryNote("");

      const response = await portalApiClient.get(
        `/supplier-portal/purchase-orders/${orderId}`
      );

      setSelectedPurchaseOrder(response.data?.data?.purchaseOrder || null);
    } catch (error) {
      setDetailError(
        error.response?.data?.message || "Failed to load purchase order details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetails() {
    if (deliveringOrderId) {
      return;
    }

    setSelectedPurchaseOrder(null);
    setDetailError("");
    setDeliveryNote("");
  }

  function canMarkDelivered(order) {
    return String(order.status || "").toLowerCase() === "ordered";
  }

  async function handleMarkDelivered(orderId) {
    try {
      setDeliveringOrderId(orderId);
      setError("");
      setDetailError("");
      setSuccessMessage("");

      await portalApiClient.patch(
        `/supplier-portal/purchase-orders/${orderId}/deliver`,
        {
          delivery_note: deliveryNote || null,
        }
      );

      setSuccessMessage(
        "Purchase order marked as delivered. Staff will confirm receiving before stock is updated."
      );

      await fetchPurchaseOrders();
      await handleViewPurchaseOrder(orderId);
    } catch (error) {
      setDetailError(
        error.response?.data?.message ||
          "Failed to mark purchase order as delivered."
      );
    } finally {
      setDeliveringOrderId(null);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  }

  function formatLabel(value) {
    if (!value) {
      return "-";
    }

    return String(value)
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function getStatusBadgeClass(status) {
    const normalisedStatus = String(status || "").toLowerCase();

    if (normalisedStatus === "received") {
      return "badge badge-success";
    }

    if (normalisedStatus === "supplier_delivered") {
      return "badge badge-info";
    }

    if (normalisedStatus === "ordered") {
      return "badge badge-warning";
    }

    if (normalisedStatus === "cancelled") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const activeOrders = purchaseOrders.filter((order) => {
    return ["ordered", "supplier_delivered"].includes(order.status);
  });

  const completedOrders = purchaseOrders.filter((order) => {
    return ["received", "cancelled"].includes(order.status);
  });

  return (
    <section className="supplier-portal-page">
      <div className="page-header">
        <div>
          <h2>Assigned Purchase Orders</h2>
          <p>
            Review purchase orders from the business and mark ordered items as
            delivered when dispatched.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={fetchPurchaseOrders}
          disabled={loading}
        >
          <FiRefreshCw />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}
      {successMessage && (
        <p className="message success-message">{successMessage}</p>
      )}

      <div className="dashboard-metric-grid supplier-portal-metrics">
        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiTruck />
          </div>

          <div>
            <span>Active Orders</span>
            <strong>{activeOrders.length}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedOrders.length}</strong>
          </div>
        </article>
      </div>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Purchase Order List</h2>
            <p>
              {loading
                ? "Loading purchase orders..."
                : `Showing ${purchaseOrders.length} purchase orders assigned to your supplier account.`}
            </p>
          </div>
        </div>

        <div className="panel-body">
          {loading ? (
            <p>Loading purchase orders...</p>
          ) : purchaseOrders.length === 0 ? (
            <div className="empty-state">
              <FiFileText />
              <h3>No purchase orders assigned</h3>
              <p>Purchase orders will appear here after Staff creates them.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Expected Delivery</th>
                    <th>Supplier Delivered</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>PO-{String(order.id).padStart(4, "0")}</strong>
                      </td>

                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {formatLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {order.item_count}
                        </span>
                      </td>

                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>{formatDate(order.expected_delivery_date)}</td>
                      <td>{formatDateTime(order.supplier_delivered_at)}</td>
                      <td>{formatDateTime(order.received_at)}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleViewPurchaseOrder(order.id)}
                          >
                            <FiEye />
                            View
                          </button>

                          {canMarkDelivered(order) && (
                            <button
                              type="button"
                              className="success-button"
                              onClick={() => handleViewPurchaseOrder(order.id)}
                            >
                              <FiTruck />
                              Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {(selectedPurchaseOrder || detailLoading || detailError) && (
        <div className="modal-backdrop">
          <section className="modal-card supplier-po-detail-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {selectedPurchaseOrder
                    ? `PO-${String(selectedPurchaseOrder.id).padStart(4, "0")}`
                    : "Purchase Order Details"}
                </h2>
                <p>Review purchase order items and delivery status.</p>
              </div>

              <button
                type="button"
                className="icon-button modal-close-button"
                onClick={handleCloseDetails}
                disabled={Boolean(deliveringOrderId)}
                aria-label="Close purchase order details"
              >
                <FiX />
              </button>
            </div>

            {detailLoading ? (
              <p>Loading purchase order details...</p>
            ) : detailError ? (
              <p className="message error-message">{detailError}</p>
            ) : (
              selectedPurchaseOrder && (
                <>
                  <div className="detail-summary-grid">
                    <article>
                      <span>Status</span>
                      <strong>
                        <span
                          className={getStatusBadgeClass(
                            selectedPurchaseOrder.status
                          )}
                        >
                          {formatLabel(selectedPurchaseOrder.status)}
                        </span>
                      </strong>
                    </article>

                    <article>
                      <span>Expected Delivery</span>
                      <strong>
                        {formatDate(selectedPurchaseOrder.expected_delivery_date)}
                      </strong>
                    </article>

                    <article>
                      <span>Total</span>
                      <strong>
                        {formatCurrency(selectedPurchaseOrder.total_amount)}
                      </strong>
                    </article>

                    <article>
                      <span>Supplier Delivered</span>
                      <strong>
                        {formatDateTime(
                          selectedPurchaseOrder.supplier_delivered_at
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>Received By Staff</span>
                      <strong>
                        {formatDateTime(selectedPurchaseOrder.received_at)}
                      </strong>
                    </article>
                  </div>

                  {selectedPurchaseOrder.notes && (
                    <p className="auth-note">{selectedPurchaseOrder.notes}</p>
                  )}

                  {selectedPurchaseOrder.supplier_delivery_note && (
                    <p className="auth-note">
                      Supplier note:{" "}
                      {selectedPurchaseOrder.supplier_delivery_note}
                    </p>
                  )}

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                          <th>Unit Cost</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedPurchaseOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.product_sku}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unit_cost)}</td>
                            <td>{formatCurrency(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {canMarkDelivered(selectedPurchaseOrder) && (
                    <div className="supplier-delivery-box">
                      <label htmlFor="delivery_note">Delivery Note</label>
                      <textarea
                        id="delivery_note"
                        value={deliveryNote}
                        onChange={(event) => setDeliveryNote(event.target.value)}
                        rows="3"
                        placeholder="Example: Delivered to receiving desk."
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleMarkDelivered(selectedPurchaseOrder.id)
                        }
                        disabled={Boolean(deliveringOrderId)}
                      >
                        <FiTruck />
                        {deliveringOrderId
                          ? "Marking Delivered..."
                          : "Mark as Delivered"}
                      </button>

                      <p>
                        This does not increase stock. Staff must receive the PO
                        inside the ERP before stock is updated.
                      </p>
                    </div>
                  )}
                </>
              )
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default SupplierPurchaseOrdersPage;