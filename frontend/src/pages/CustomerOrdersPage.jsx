import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

import portalApiClient from "../api/portalApiClient";

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchOrders(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await portalApiClient.get("/customer-portal/orders");
      setOrders(response.data?.data?.orders || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

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

  function getOrderStatusClass(status) {
    if (status === "delivered") {
      return "delivered";
    }

    if (status === "cancelled") {
      return "cancelled";
    }

    if (status === "placed") {
      return "placed";
    }

    return "processing";
  }

  function getOrderProgressText(order) {
    if (order.status === "delivered") {
      return `Delivered ${formatDate(order.delivered_at)}`;
    }

    if (order.status === "placed") {
      return "Order submitted. Waiting for staff delivery confirmation.";
    }

    if (order.status === "cancelled") {
      return "This order has been cancelled.";
    }

    return "Order is being processed by staff.";
  }

  function getProgressStep(order) {
    if (order.status === "delivered") {
      return 3;
    }

    if (order.status === "cancelled") {
      return 0;
    }

    if (order.status === "placed") {
      return 1;
    }

    return 2;
  }

  return (
    <section className="cf-orders-page">
      <div className="cf-orders-header">
        <div>
          <span>Order Tracking</span>
          <h1>My Orders</h1>
          <p>Track submitted orders, fulfilment status, and delivery progress.</p>
        </div>

        <button
          type="button"
          className="cf-orders-refresh"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <FiRefreshCw />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}

      {loading ? (
        <div className="cf-shop-state">
          <FiFileText />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="cf-orders-empty">
          <FiShoppingBag />
          <h2>No orders yet</h2>
          <p>Your submitted orders will appear here after checkout.</p>

          <Link to="/customer/products">Browse Products</Link>
        </div>
      ) : (
        <div className="cf-orders-list">
          {orders.map((order) => {
            const statusClass = getOrderStatusClass(order.status);
            const progressStep = getProgressStep(order);

            return (
              <article key={order.id} className="cf-order-card">
                <div className="cf-order-card-header">
                  <div>
                    <span>Sales Order</span>
                    <h2>SO-{String(order.id).padStart(4, "0")}</h2>
                    <p>{formatDate(order.created_at)}</p>
                  </div>

                  <strong className={`cf-order-status ${statusClass}`}>
                    {formatStatus(order.status)}
                  </strong>
                </div>

                <div className="cf-order-progress">
                  <div className={progressStep >= 1 ? "active" : ""}>
                    <FiCheckCircle />
                    <span>Placed</span>
                  </div>

                  <div className={progressStep >= 2 ? "active" : ""}>
                    <FiPackage />
                    <span>Processing</span>
                  </div>

                  <div className={progressStep >= 3 ? "active" : ""}>
                    <FiTruck />
                    <span>Delivered</span>
                  </div>
                </div>

                <p className="cf-order-progress-note">
                  <FiClock />
                  {getOrderProgressText(order)}
                </p>

                <div className="cf-order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="cf-order-item">
                      <div className="cf-order-item-image">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              event.currentTarget.nextElementSibling.style.display =
                                "grid";
                            }}
                          />
                        ) : null}

                        <div
                          className="cf-order-item-fallback"
                          style={{ display: item.image_url ? "none" : "grid" }}
                        >
                          {getProductInitials(item.product_name)}
                        </div>
                      </div>

                      <div className="cf-order-item-info">
                        <span>{item.sku}</span>
                        <strong>{item.product_name}</strong>
                        <p>
                          {item.category || "General"} · Qty {item.quantity}
                        </p>
                      </div>

                      <strong className="cf-order-item-total">
                        {formatCurrency(item.line_total)}
                      </strong>
                    </div>
                  ))}
                </div>

                {order.status === "delivered" && (
                  <div className="cf-order-delivery-note">
                    <strong>Delivery confirmed</strong>
                    <span>
                      {formatDate(order.delivered_at)}
                      {order.delivered_by_name
                        ? ` by ${order.delivered_by_name}`
                        : ""}
                    </span>
                  </div>
                )}

                <div className="cf-order-total">
                  <span>Order Total</span>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CustomerOrdersPage;