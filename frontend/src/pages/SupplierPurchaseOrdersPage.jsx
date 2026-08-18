import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiSearch,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  function getProductInitials(productName) {
    if (!productName) {
      return "P";
    }

    return productName
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  function getStatusClass(status) {
    const normalisedStatus = String(status || "").toLowerCase();

    if (normalisedStatus === "supplier_delivered") {
      return "supplier-delivered";
    }

    return normalisedStatus || "ordered";
  }

  const activeOrders = purchaseOrders.filter((order) =>
    ["ordered", "supplier_delivered"].includes(order.status)
  );

  const actionRequiredOrders = purchaseOrders.filter((order) =>
    canMarkDelivered(order)
  );

  const awaitingStaffOrders = purchaseOrders.filter(
    (order) => order.status === "supplier_delivered"
  );

  const completedOrders = purchaseOrders.filter((order) =>
    ["received", "cancelled"].includes(order.status)
  );

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      const orderNumber = `PO-${String(order.id).padStart(4, "0")}`;
      const searchableText = `${orderNumber} ${order.status} ${
        order.notes || ""
      } ${order.created_by_name || ""}`.toLowerCase();

      const matchesSearch = searchableText.includes(
        searchQuery.trim().toLowerCase()
      );

      const matchesStatus =
        statusFilter === "all" || String(order.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  return (
    <section className="sf-page">
      <div className="sf-page-header">
        <div>
          <span>Supplier Purchase Orders</span>
          <h1>Assigned Purchase Orders</h1>
          <p>
            Review purchase orders from the business, confirm dispatch, and let
            staff complete receiving.
          </p>
        </div>

        <button
          type="button"
          className="sf-refresh-button"
          onClick={fetchPurchaseOrders}
          disabled={loading}
        >
          <FiRefreshCw />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className="message error-message sf-message">{error}</p>}

      {successMessage && (
        <p className="message success-message sf-message">{successMessage}</p>
      )}

      <div className="sf-metrics-grid">
        <article className="sf-metric-card">
          <div className="sf-metric-icon">
            <FiTruck />
          </div>

          <div>
            <span>Active Orders</span>
            <strong>{activeOrders.length}</strong>
          </div>
        </article>

        <article className="sf-metric-card">
          <div className="sf-metric-icon">
            <FiClock />
          </div>

          <div>
            <span>Action Required</span>
            <strong>{actionRequiredOrders.length}</strong>
          </div>
        </article>

        <article className="sf-metric-card">
          <div className="sf-metric-icon">
            <FiPackage />
          </div>

          <div>
            <span>Awaiting Staff</span>
            <strong>{awaitingStaffOrders.length}</strong>
          </div>
        </article>

        <article className="sf-metric-card">
          <div className="sf-metric-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedOrders.length}</strong>
          </div>
        </article>
      </div>

      <div className="sf-toolbar">
        <div className="sf-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by PO number, status, creator, or note..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="ordered">Ordered</option>
          <option value="supplier_delivered">Supplier Delivered</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="sf-loading-state">
          <FiFileText />
          <p>Loading purchase orders...</p>
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="sf-empty-state">
          <FiFileText />
          <h2>No purchase orders assigned</h2>
          <p>Purchase orders will appear here after staff creates them.</p>
        </div>
      ) : filteredPurchaseOrders.length === 0 ? (
        <div className="sf-empty-state">
          <FiSearch />
          <h2>No matching purchase orders</h2>
          <p>Try changing your search or status filter.</p>
        </div>
      ) : (
        <div className="sf-po-grid">
          {filteredPurchaseOrders.map((order) => {
            const statusClass = getStatusClass(order.status);

            return (
              <article key={order.id} className="sf-po-card">
                <div className="sf-po-card-header">
                  <div>
                    <span>Purchase Order</span>
                    <h2>PO-{String(order.id).padStart(4, "0")}</h2>
                    <p>
                      Created by {order.created_by_name || "staff"} · Expected{" "}
                      {formatDate(order.expected_delivery_date)}
                    </p>
                  </div>

                  <strong className={`sf-status-pill ${statusClass}`}>
                    {formatLabel(order.status)}
                  </strong>
                </div>

                <div className="sf-po-summary">
                  <article>
                    <span>Items</span>
                    <strong>{order.item_count}</strong>
                  </article>

                  <article>
                    <span>Total</span>
                    <strong>{formatCurrency(order.total_amount)}</strong>
                  </article>

                  <article>
                    <span>Supplier Delivered</span>
                    <strong>{formatDateTime(order.supplier_delivered_at)}</strong>
                  </article>

                  <article>
                    <span>Staff Received</span>
                    <strong>{formatDateTime(order.received_at)}</strong>
                  </article>
                </div>

                <div className="sf-po-actions">
                  <button
                    type="button"
                    className="sf-secondary-action"
                    onClick={() => handleViewPurchaseOrder(order.id)}
                  >
                    <FiEye />
                    View Details
                  </button>

                  {canMarkDelivered(order) && (
                    <button
                      type="button"
                      className="sf-deliver-action"
                      onClick={() => handleViewPurchaseOrder(order.id)}
                    >
                      <FiTruck />
                      Confirm Delivery
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(selectedPurchaseOrder || detailLoading || detailError) && (
        <div className="modal-backdrop">
          <section className="modal-card sf-modal-card">
            <div className="modal-header">
              <div>
                <h2>
                  {selectedPurchaseOrder
                    ? `PO-${String(selectedPurchaseOrder.id).padStart(4, "0")}`
                    : "Purchase Order Details"}
                </h2>
                <p>Review order items, delivery status, and supplier action.</p>
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
                  <div className="sf-detail-summary">
                    <article>
                      <span>Status</span>
                      <strong>
                        <span
                          className={`sf-status-pill ${getStatusClass(
                            selectedPurchaseOrder.status
                          )}`}
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
                      <span>Staff Received</span>
                      <strong>
                        {formatDateTime(selectedPurchaseOrder.received_at)}
                      </strong>
                    </article>
                  </div>

                  {selectedPurchaseOrder.notes && (
                    <p className="sf-detail-note">
                      Business note: {selectedPurchaseOrder.notes}
                    </p>
                  )}

                  {selectedPurchaseOrder.supplier_delivery_note && (
                    <p className="sf-detail-note">
                      Supplier note:{" "}
                      {selectedPurchaseOrder.supplier_delivery_note}
                    </p>
                  )}

                  <div className="sf-item-list">
                    {selectedPurchaseOrder.items.map((item) => (
                      <div key={item.id} className="sf-item-row">
                        <div className="sf-item-image">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                event.currentTarget.nextElementSibling.style.display = "grid";
                              }}
                            />
                          ) : null}

                          <div
                            className="sf-item-image-fallback"
                            style={{ display: item.product_image_url ? "none" : "grid" }}
                          >
                            {getProductInitials(item.product_name)}
                          </div>
                        </div>

                        <div className="sf-item-info">
                          <span>{item.product_sku}</span>
                          <strong>{item.product_name}</strong>
                          <p>{item.product_category || "General"}</p>
                        </div>

                        <div className="sf-item-stat">
                          <span>Quantity</span>
                          <strong>{item.quantity}</strong>
                        </div>

                        <div className="sf-item-stat">
                          <span>Unit Cost</span>
                          <strong>{formatCurrency(item.unit_cost)}</strong>
                        </div>

                        <div className="sf-item-stat">
                          <span>Line Total</span>
                          <strong>{formatCurrency(item.line_total)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {canMarkDelivered(selectedPurchaseOrder) && (
                    <div className="sf-delivery-box">
                      <label htmlFor="delivery_note">Delivery Note</label>

                      <textarea
                        id="delivery_note"
                        value={deliveryNote}
                        onChange={(event) => setDeliveryNote(event.target.value)}
                        rows="3"
                        placeholder="Example: Dispatched with courier. Delivery sent to receiving desk."
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
                          ? "Confirming Delivery..."
                          : "Mark as Delivered"}
                      </button>

                      <p>
                        This confirms supplier dispatch only. Stock will increase
                        after staff receives the purchase order inside CoreFlow.
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