import { useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";
import portalApiClient from "../api/portalApiClient";

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await portalApiClient.get("/customer-portal/orders");
      setOrders(response.data?.data?.orders || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
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

    return new Date(value).toLocaleString();
  }

  function formatStatus(status) {
    if (!status) {
      return "-";
    }

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getStatusBadgeClass(status) {
    if (status === "delivered") {
      return "badge badge-success";
    }

    if (status === "cancelled") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  function getOrderProgressText(order) {
    if (order.status === "delivered") {
      return `Delivered ${formatDate(order.delivered_at)}`;
    }

    if (order.status === "placed") {
      return "Order placed. Waiting for staff delivery confirmation.";
    }

    return "Order is being processed.";
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <section className="customer-portal-page">
      <div className="page-header">
        <div>
          <h2>My Orders</h2>
          <p>Track orders placed through the customer portal.</p>
        </div>

        <button type="button" className="secondary-button" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <FiFileText />
          <h3>No orders yet</h3>
          <p>Your placed orders will appear here.</p>
        </div>
      ) : (
        <div className="customer-order-list">
          {orders.map((order) => (
            <article key={order.id} className="customer-order-card">
              <div className="customer-order-header">
                <div>
                  <h3>SO-{String(order.id).padStart(4, "0")}</h3>
                  <p>{formatDate(order.created_at)}</p>
                  <p className="customer-order-progress">
                    {getOrderProgressText(order)}
                  </p>
                </div>

                <span className={getStatusBadgeClass(order.status)}>
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="customer-order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="customer-order-item">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <strong>{formatCurrency(item.line_total)}</strong>
                  </div>
                ))}
              </div>

              {order.status === "delivered" && (
                <div className="customer-order-delivery-note">
                  <strong>Delivery confirmed</strong>
                  <span>
                    {formatDate(order.delivered_at)}
                    {order.delivered_by_name ? ` by ${order.delivered_by_name}` : ""}
                  </span>
                </div>
              )}

              <div className="customer-order-total">
                <span>Total</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CustomerOrdersPage;