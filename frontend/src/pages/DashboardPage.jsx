import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTrendingUp,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiClient from "../api/apiClient";
import "../styles/dashboard.css";

const chartColors = {
  blue: "#38bdf8",
  cyan: "#22d3ee",
  purple: "#a855f7",
  pink: "#ec4899",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const pieColors = [
  chartColors.blue,
  chartColors.purple,
  chartColors.green,
  chartColors.orange,
  chartColors.red,
  chartColors.cyan,
];

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [bi, setBi] = useState(null);
  const [forecastInsight, setForecastInsight] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [forecastInsightError, setForecastInsightError] = useState("");

  async function fetchDashboardData() {
    try {
      setError("");

      const [summaryResponse, biResponse] = await Promise.all([
        apiClient.get("/dashboard/summary"),
        apiClient.get("/dashboard/bi"),
      ]);

      const dashboardSummary = summaryResponse.data?.data?.summary;
      const dashboardBi = biResponse.data?.data?.bi;

      if (!dashboardSummary || !dashboardBi) {
        throw new Error("Invalid dashboard response.");
      }

      setSummary(dashboardSummary);
      setBi(dashboardBi);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load BI dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchForecastInsight() {
    try {
      setForecastInsightError("");

      const response = await apiClient.get("/ai/sales-forecast?days=7");

      setForecastInsight(response.data?.data?.result || null);
    } catch (error) {
      setForecastInsight(null);
      setForecastInsightError(
        error.response?.data?.message || "AI forecast unavailable."
      );
    }
  }

  async function refreshDashboard() {
    try {
      setRefreshing(true);
      await Promise.all([fetchDashboardData(), fetchForecastInsight()]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    fetchForecastInsight();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
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

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
  }

  function normaliseStatusRows(rows = [], labelKey = "status") {
    return rows.map((row) => ({
      ...row,
      label: formatLabel(row[labelKey]),
      count: Number(row.count || 0),
      total_amount: Number(row.total_amount || 0),
    }));
  }

  if (loading) {
    return (
      <section className="bi-dashboard-page">
        <div className="bi-dashboard-loading">
          <FiActivity />
          <h1>Loading BI dashboard...</h1>
          <p>Preparing operational analytics and AI insights.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bi-dashboard-page">
        <div className="bi-dashboard-loading">
          <FiAlertTriangle />
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>

          <button type="button" onClick={refreshDashboard}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  const salesTrend = (bi?.salesTrend || []).map((item) => ({
    ...item,
    revenue: Number(item.revenue || 0),
    order_count: Number(item.order_count || 0),
  }));

  const forecastItems = (forecastInsight?.forecast || []).map((item) => ({
    label: new Date(item.date).toLocaleDateString(undefined, {
      weekday: "short",
    }),
    predicted_sales: Number(item.predicted_sales || 0),
  }));

  const salesStatusData = normaliseStatusRows(
    bi?.salesOrderStatusBreakdown || []
  );

  const invoiceStatusData = normaliseStatusRows(bi?.invoiceStatusBreakdown || []);

  const purchaseOrderStatusData = normaliseStatusRows(
    bi?.purchaseOrderStatusBreakdown || []
  );

  const inventoryRiskData = (bi?.inventoryRiskBreakdown || []).map((item) => ({
    ...item,
    label: item.risk_level,
    count: Number(item.count || 0),
  }));

  const customerActivityData = (bi?.customerActivityBreakdown || []).map(
    (item) => ({
      ...item,
      label: item.status || item.activity_status,
      count: Number(item.count || 0),
    })
  );

  const topProducts = (bi?.topProducts || []).map((item) => ({
    ...item,
    quantity_sold: Number(item.quantity_sold || 0),
    revenue: Number(item.revenue || 0),
  }));

  const recentActivity = summary?.recentActivity || [];

  const lowStockCount = Number(summary?.lowStockProducts || 0);
  const pendingInvoices = Number(summary?.pendingInvoices || 0);
  const pendingApprovals = Number(summary?.pendingApprovals || 0);
  const pendingReceipts = Number(summary?.pendingReceiptPurchaseOrders || 0);

  const totalForecastSales = forecastItems.reduce((sum, item) => {
    return sum + Number(item.predicted_sales || 0);
  }, 0);

  const priorityTotal =
    lowStockCount + pendingInvoices + pendingApprovals + pendingReceipts;

  const kpiCards = [
    {
      label: "Paid revenue",
      value: formatCurrency(summary?.totalPaidRevenue),
      detail: "Confirmed paid invoices",
      icon: FiDollarSign,
      tone: "cyan",
    },
    {
      label: "7-day forecast",
      value: forecastInsightError ? "N/A" : formatCurrency(totalForecastSales),
      detail: forecastInsightError || "AI predicted sales",
      icon: FiTrendingUp,
      tone: "purple",
    },
    {
      label: "Operational alerts",
      value: priorityTotal,
      detail: "Stock, invoices, receipts, approvals",
      icon: FiAlertTriangle,
      tone: priorityTotal > 0 ? "orange" : "green",
    },
    {
      label: "Customers",
      value: summary?.totalCustomers || 0,
      detail: "Customer records",
      icon: FiUsers,
      tone: "blue",
    },
  ];

  const priorityItems = [
    {
      label: "Low stock",
      value: lowStockCount,
      icon: FiBox,
      to: "/products",
    },
    {
      label: "Pending invoices",
      value: pendingInvoices,
      icon: FiFileText,
      to: "/invoices",
    },
    {
      label: "Pending receipt",
      value: pendingReceipts,
      icon: FiShoppingBag,
      to: "/purchase-orders",
    },
    {
      label: "Pending approvals",
      value: pendingApprovals,
      icon: FiShield,
      to: "/approvals",
    },
  ];

  return (
    <section className="bi-dashboard-page">
      <div className="bi-dashboard-shell">
        <div className="bi-dashboard-header">
          <div>
            <span className="bi-dashboard-kicker">Business Intelligence</span>
            <h1>Operations Intelligence</h1>
            <p>
              Sales trends, AI forecast, inventory risk, procurement status, and
              customer activity in one dashboard.
            </p>
          </div>

          <button
            type="button"
            className="bi-refresh-button"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <FiRefreshCw />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="bi-kpi-grid">
          {kpiCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className={`bi-kpi-card kpi-${card.tone}`}
              >
                <div className="bi-kpi-icon">
                  <Icon />
                </div>

                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.detail}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="bi-main-grid">
          <section className="bi-chart-card bi-chart-card-large">
            <div className="bi-chart-header">
              <div>
                <span>Sales BI</span>
                <h2>Revenue trend</h2>
              </div>

              <small>Last 30 days</small>
            </div>

            <div className="bi-chart-body">
              {salesTrend.length === 0 ? (
                <div className="bi-empty-state">
                  <FiTrendingUp />
                  <p>Create sales orders across different dates to show trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={310}>
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={chartColors.cyan}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColors.cyan}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#263248" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `$${Number(value) / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#f8fafc",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartColors.cyan}
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="bi-chart-card">
            <div className="bi-chart-header">
              <div>
                <span>AI Forecast</span>
                <h2>Next 7 days</h2>
              </div>

              <FiTrendingUp />
            </div>

            <div className="bi-chart-body compact">
              {forecastItems.length === 0 ? (
                <div className="bi-empty-state">
                  <FiAlertTriangle />
                  <p>{forecastInsightError || "Forecast data unavailable."}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={forecastItems}>
                    <CartesianGrid stroke="#263248" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#f8fafc",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar
                      dataKey="predicted_sales"
                      fill={chartColors.purple}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="bi-priority-card">
            <div className="bi-chart-header">
              <div>
                <span>Action Queue</span>
                <h2>Needs attention</h2>
              </div>

              <strong>{priorityTotal}</strong>
            </div>

            <div className="bi-priority-list">
              {priorityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.label} to={item.to} className="bi-priority-row">
                    <div>
                      <Icon />
                      <span>{item.label}</span>
                    </div>

                    <strong>{item.value}</strong>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="bi-chart-card">
            <div className="bi-chart-header">
              <div>
                <span>Sales Orders</span>
                <h2>Status mix</h2>
              </div>

              <FiShoppingCart />
            </div>

            <div className="bi-chart-body compact">
              {salesStatusData.length === 0 ? (
                <div className="bi-empty-state">
                  <p>No sales order status data.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={salesStatusData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                    >
                      {salesStatusData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#f8fafc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="bi-chart-card">
            <div className="bi-chart-header">
              <div>
                <span>Procurement</span>
                <h2>Purchase orders</h2>
              </div>

              <FiTruck />
            </div>

            <div className="bi-chart-body compact">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={purchaseOrderStatusData}>
                  <CartesianGrid stroke="#263248" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="count" fill={chartColors.blue} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bi-chart-card">
            <div className="bi-chart-header">
              <div>
                <span>Inventory BI</span>
                <h2>Stock risk</h2>
              </div>

              <FiBox />
            </div>

            <div className="bi-chart-body compact">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={inventoryRiskData}>
                  <CartesianGrid stroke="#263248" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {inventoryRiskData.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={
                          entry.label === "Low stock"
                            ? chartColors.red
                            : entry.label === "Watch"
                            ? chartColors.orange
                            : chartColors.green
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bi-chart-card">
            <div className="bi-chart-header">
              <div>
                <span>Customer Intelligence</span>
                <h2>Activity risk</h2>
              </div>

              <FiUsers />
            </div>

            <div className="bi-chart-body compact">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={customerActivityData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={4}
                  >
                    {customerActivityData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bi-chart-card bi-chart-card-wide">
            <div className="bi-chart-header">
              <div>
                <span>Product BI</span>
                <h2>Top selling products</h2>
              </div>

              <FiArrowRight />
            </div>

            <div className="bi-product-list">
              {topProducts.length === 0 ? (
                <div className="bi-empty-state">
                  <p>No product sales data available.</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="bi-product-row">
                    <span>{index + 1}</span>

                    <div>
                      <strong>{product.name}</strong>
                      <p>
                        {product.quantity_sold} sold ·{" "}
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>

                    <div className="bi-product-bar">
                      <span
                        style={{
                          width: `${Math.max(
                            (product.quantity_sold /
                              Math.max(
                                ...topProducts.map((item) => item.quantity_sold),
                                1
                              )) *
                              100,
                            6
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bi-chart-card bi-activity-panel">
            <div className="bi-chart-header">
              <div>
                <span>Audit Trail</span>
                <h2>Recent activity</h2>
              </div>

              <Link to="/audit-logs">
                View
                <FiArrowRight />
              </Link>
            </div>

            <div className="bi-activity-list">
              {recentActivity.length === 0 ? (
                <div className="bi-empty-state">
                  <FiClock />
                  <p>No recent activity.</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="bi-activity-row">
                    <span />

                    <div>
                      <strong>{formatLabel(activity.action)}</strong>
                      <p>
                        {activity.module} · {activity.result} ·{" "}
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="bi-feature-strip">
          <article>
            <FiTrendingUp />
            <div>
              <strong>Predictive sales analytics</strong>
              <p>Forecasting is powered by the separate Python AI service.</p>
            </div>
          </article>

          <article>
            <FiShield />
            <div>
              <strong>Fraud and anomaly visibility</strong>
              <p>Audit logs support suspicious activity detection.</p>
            </div>
          </article>

          <article>
            <FiUsers />
            <div>
              <strong>Customer churn-risk insight</strong>
              <p>Customer activity prediction supports retention decisions.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;