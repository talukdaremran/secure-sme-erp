import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiShoppingBag,
  FiShoppingCart,
  FiTruck,
  FiUsers,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardSummary() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/dashboard/summary");
      const dashboardSummary = response.data?.data?.summary;

      if (!dashboardSummary) {
        throw new Error("Invalid dashboard summary response.");
      }

      setSummary(dashboardSummary);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load dashboard summary."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) {
      return "N/A";
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

  function getPurchaseOrderStatusClass(status) {
    if (status === "received") {
      return "badge badge-success";
    }

    if (status === "ordered") {
      return "badge badge-info";
    }

    if (status === "cancelled") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  function getApprovalStatusClass(status) {
    if (status === "approved") {
      return "badge badge-success";
    }

    if (status === "rejected") {
      return "badge badge-danger";
    }

    return "badge badge-warning";
  }

  if (loading) {
    return (
      <section>
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Loading business summary...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Something went wrong while loading the dashboard.</p>
          </div>
        </div>

        <p className="message error-message">{error}</p>

        <button type="button" onClick={fetchDashboardSummary}>
          Try Again
        </button>
      </section>
    );
  }

  const lowStockCount = Number(summary?.lowStockProducts || 0);
  const recentActivity = summary?.recentActivity || [];
  const recentPurchaseOrders = summary?.recentPurchaseOrders || [];
  const recentApprovalRequests = summary?.recentApprovalRequests || [];

  const metricCards = [
    {
      label: "Total Products",
      value: summary?.totalProducts || 0,
      icon: FiBox,
      variant: "blue",
    },
    {
      label: "Total Customers",
      value: summary?.totalCustomers || 0,
      icon: FiUsers,
      variant: "green",
    },
    {
      label: "Sales Orders",
      value: summary?.totalSalesOrders || 0,
      icon: FiShoppingCart,
      variant: "purple",
    },
    {
      label: "Invoices",
      value: summary?.totalInvoices || 0,
      icon: FiFileText,
      variant: "orange",
    },
    {
      label: "Paid Revenue",
      value: formatCurrency(summary?.totalPaidRevenue),
      icon: FiDollarSign,
      variant: "green",
    },
    {
      label: "Pending Invoices",
      value: summary?.pendingInvoices || 0,
      icon: FiClock,
      variant: "orange",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount,
      icon: FiAlertTriangle,
      variant: lowStockCount > 0 ? "red" : "green",
    },
    {
      label: "System Status",
      value: "Active",
      icon: FiCheckCircle,
      variant: "green",
    },
  ];

  const procurementMetricCards = [
    {
      label: "Total Suppliers",
      value: summary?.totalSuppliers || 0,
      icon: FiTruck,
      variant: "blue",
    },
    {
      label: "Open Purchase Orders",
      value: summary?.openPurchaseOrders || 0,
      icon: FiShoppingBag,
      variant: "purple",
    },
    {
      label: "Pending Receipt",
      value: summary?.pendingReceiptPurchaseOrders || 0,
      icon: FiClock,
      variant: "orange",
    },
    {
      label: "Received Orders",
      value: summary?.receivedPurchaseOrders || 0,
      icon: FiCheckCircle,
      variant: "green",
    },
  ];

  const approvalMetricCards = [
    {
      label: "Pending Approvals",
      value: summary?.pendingApprovals || 0,
      icon: FiShield,
      variant: Number(summary?.pendingApprovals || 0) > 0 ? "orange" : "green",
    },
    {
      label: "Approved Requests",
      value: summary?.approvedApprovals || 0,
      icon: FiCheckCircle,
      variant: "green",
    },
    {
      label: "Rejected Requests",
      value: summary?.rejectedApprovals || 0,
      icon: FiXCircle,
      variant: "red",
    },
  ];

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of sales, customers, inventory, invoices, procurement, and
            recent system activity.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" onClick={fetchDashboardSummary}>
            Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-metric-grid">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`dashboard-metric-card metric-${card.variant}`}
            >
              <div className="metric-icon">
                <Icon />
              </div>

              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Low Stock Alert</h2>
            <p>Inventory items that need attention.</p>
          </div>

          <div className="panel-body">
            {lowStockCount === 0 ? (
              <div className="empty-state">
                <FiCheckCircle />
                <h3>Inventory looks healthy</h3>
                <p>No products are currently below their low stock level.</p>
              </div>
            ) : (
              <div className="empty-state warning-state">
                <FiAlertTriangle />
                <h3>{lowStockCount} low stock item(s)</h3>
                <p>
                  Some products have reached or passed their low stock level.
                  Check the Products or Inventory page for details.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
            <p>Latest security and system activity records.</p>
          </div>

          <div className="panel-body">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <FiClock />
                <h3>No recent activity</h3>
                <p>Recent audit events will appear here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-dot" />

                    <div>
                      <strong>{formatLabel(activity.action)}</strong>
                      <p>
                        {activity.module} · {activity.result} ·{" "}
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-section-header">
        <div>
          <h2>Procurement Overview</h2>
          <p>Supplier and purchase order activity across the ERP.</p>
        </div>
      </div>

      <div className="dashboard-metric-grid">
        {procurementMetricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`dashboard-metric-card metric-${card.variant}`}
            >
              <div className="metric-icon">
                <Icon />
              </div>

              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-metric-grid procurement-spend-grid">
        <article className="dashboard-metric-card metric-green procurement-spend-card">
          <div className="metric-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Received Procurement Spend</span>
            <strong>{formatCurrency(summary?.receivedProcurementSpend)}</strong>
          </div>
        </article>
      </div>

      <div className="dashboard-grid procurement-dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Recent Purchase Orders</h2>
            <p>Latest supplier purchase orders created in the system.</p>
          </div>

          <div className="panel-body">
            {recentPurchaseOrders.length === 0 ? (
              <div className="empty-state">
                <FiShoppingBag />
                <h3>No purchase orders yet</h3>
                <p>Create purchase orders to see procurement activity here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentPurchaseOrders.map((order) => (
                  <div
                    key={order.id}
                    className="activity-item purchase-order-activity-item"
                  >
                    <div className="activity-dot" />

                    <div>
                      <strong>
                        PO-{String(order.id).padStart(4, "0")} ·{" "}
                        {order.supplier_name}
                      </strong>

                      <p>
                        {formatCurrency(order.total_amount)} · Created{" "}
                        {formatShortDate(order.created_at)}
                      </p>

                      <div className="purchase-order-activity-footer">
                        <span className={getPurchaseOrderStatusClass(order.status)}>
                          {formatLabel(order.status)}
                        </span>

                        {order.expected_delivery_date && (
                          <small>
                            Expected{" "}
                            {formatShortDate(order.expected_delivery_date)}
                          </small>
                        )}

                        {order.received_at && (
                          <small>
                            Received {formatShortDate(order.received_at)}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-section-header">
        <div>
          <h2>Approval Overview</h2>
          <p>Critical inventory adjustment requests waiting for Admin review.</p>
        </div>
      </div>

      <div className="dashboard-metric-grid approval-metric-grid">
        {approvalMetricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`dashboard-metric-card metric-${card.variant}`}
            >
              <div className="metric-icon">
                <Icon />
              </div>

              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid approval-dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Recent Approval Requests</h2>
            <p>Latest inventory adjustment requests and review outcomes.</p>
          </div>

          <div className="panel-body">
            {recentApprovalRequests.length === 0 ? (
              <div className="empty-state">
                <FiShield />
                <h3>No approval requests yet</h3>
                <p>Inventory adjustment requests will appear here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentApprovalRequests.map((request) => (
                  <div
                    key={request.id}
                    className="activity-item approval-activity-item"
                  >
                    <div className="activity-dot" />

                    <div>
                      <strong>
                        REQ-{String(request.id).padStart(4, "0")} ·{" "}
                        {request.product_name || "Product"}
                      </strong>

                      <p>
                        {formatLabel(request.action_type)} · Requested by{" "}
                        {request.requested_by_name || "-"} ·{" "}
                        {formatShortDate(request.created_at)}
                      </p>

                      <div className="approval-activity-footer">
                        <span className={getApprovalStatusClass(request.status)}>
                          {formatLabel(request.status)}
                        </span>

                        {request.reviewed_by_name && (
                          <small>Reviewed by {request.reviewed_by_name}</small>
                        )}

                        {request.reviewed_at && (
                          <small>Reviewed {formatShortDate(request.reviewed_at)}</small>
                        )}
                      </div>

                      {request.reason && (
                        <p className="approval-activity-reason">{request.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export default DashboardPage;