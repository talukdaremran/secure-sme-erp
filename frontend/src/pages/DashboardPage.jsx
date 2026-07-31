import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiShoppingCart,
  FiUsers,
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
        error.response?.data?.message ||
          "Failed to load dashboard summary."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  function formatCurrency(value) {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(numberValue);
  }

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of sales, customers, inventory, invoices, and recent system
            activity.
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
                  Some products have reached or passed their low stock level. Check the
                  Products or Inventory page for details.
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
    </section>
  );
}

export default DashboardPage;