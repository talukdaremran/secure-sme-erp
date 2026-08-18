import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBarChart2,
  FiBox,
  FiClock,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGrid,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import apiClient from "../api/apiClient";
import "../styles/dashboard.css";

const chartColors = {
  blue: "#2563eb",
  indigo: "#4f46e5",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  slate: "#64748b",
};

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  color: "#111827",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
};

const dashboardStorageKey = "coreflow.dashboard.visibleWidgets.v4";

const defaultVisibleWidgets = {
  revenueTrend: true,
  actionQueue: true,
  forecastTrend: true,
  salesStatus: true,
  procurement: true,
  inventoryRisk: true,
  customerRisk: true,
  topProducts: true,
  auditTrail: true,
};

const widgetDefinitions = [
  {
    id: "revenueTrend",
    title: "Revenue trend",
    description: "Main time-series revenue visual",
  },
  {
    id: "actionQueue",
    title: "Action queue",
    description: "Operational work items requiring attention",
  },
  {
    id: "forecastTrend",
    title: "Forecast trend",
    description: "Next 7 days predicted sales",
  },
  {
    id: "salesStatus",
    title: "Sales status",
    description: "Sales order status distribution",
  },
  {
    id: "procurement",
    title: "Procurement",
    description: "Purchase order status distribution",
  },
  {
    id: "inventoryRisk",
    title: "Inventory risk",
    description: "Stock health breakdown",
  },
  {
    id: "customerRisk",
    title: "Customer risk",
    description: "Customer activity classification",
  },
  {
    id: "topProducts",
    title: "Top products",
    description: "Product ranking by quantity sold",
  },
  {
    id: "auditTrail",
    title: "Audit trail",
    description: "Recent system activity",
  },
];

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [bi, setBi] = useState(null);
  const [forecastInsight, setForecastInsight] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [forecastInsightError, setForecastInsightError] = useState("");

  const [trendRange, setTrendRange] = useState("30");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try {
      const savedWidgets = window.localStorage.getItem(dashboardStorageKey);

      if (!savedWidgets) {
        return defaultVisibleWidgets;
      }

      return {
        ...defaultVisibleWidgets,
        ...JSON.parse(savedWidgets),
      };
    } catch {
      return defaultVisibleWidgets;
    }
  });

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
      setError(error.response?.data?.message || "Failed to load dashboard data.");
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

  useEffect(() => {
    window.localStorage.setItem(
      dashboardStorageKey,
      JSON.stringify(visibleWidgets)
    );
  }, [visibleWidgets]);

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

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function normaliseStatusRows(rows = [], labelKey = "status") {
    return rows.map((row) => ({
      ...row,
      label: formatLabel(row[labelKey]),
      count: Number(row.count || 0),
      total_amount: Number(row.total_amount || 0),
    }));
  }

  function isWidgetVisible(widgetId) {
    return visibleWidgets[widgetId] !== false;
  }

  function hideWidget(widgetId) {
    setVisibleWidgets((previousWidgets) => ({
      ...previousWidgets,
      [widgetId]: false,
    }));
  }

  function toggleWidget(widgetId) {
    setVisibleWidgets((previousWidgets) => ({
      ...previousWidgets,
      [widgetId]: previousWidgets[widgetId] === false,
    }));
  }

  function resetWidgets() {
    setVisibleWidgets(defaultVisibleWidgets);
  }

  function ReportCard({
    id,
    eyebrow,
    title,
    action,
    className = "",
    children,
  }) {
    return (
      <section className={`msdash-card ${className}`}>
        <div className="msdash-card-header">
          <div>
            <span>{eyebrow}</span>
            <h2>{title}</h2>
          </div>

          <div className="msdash-card-actions">
            {action}

            <button
              type="button"
              className="msdash-icon-button"
              onClick={() => hideWidget(id)}
              aria-label={`Hide ${title}`}
              title="Hide widget"
            >
              <FiX />
            </button>
          </div>
        </div>

        {children}
      </section>
    );
  }

  if (loading) {
    return (
      <section className="msdash-page">
        <div className="msdash-state-card">
          <FiActivity />
          <h1>Loading dashboard</h1>
          <p>Preparing operational reports and AI insights.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="msdash-page">
        <div className="msdash-state-card">
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
    label: item.label || formatShortDate(item.date || item.sale_date),
    revenue: Number(item.revenue || 0),
    order_count: Number(item.order_count || 0),
  }));

  const visibleSalesTrend = salesTrend.slice(-Number(trendRange));

  const forecastItems = (forecastInsight?.forecast || []).map((item) => ({
    label: formatShortDate(item.date),
    predicted_sales: Number(item.predicted_sales || 0),
  }));

  const salesStatusData = normaliseStatusRows(
    bi?.salesOrderStatusBreakdown || []
  );

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

  const topProductChartData = topProducts.slice(0, 7).map((product) => ({
    name: product.name,
    quantity_sold: product.quantity_sold,
    revenue: product.revenue,
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

  const visibleWidgetCount = Object.values(visibleWidgets).filter(Boolean).length;

  const kpiCards = [
    {
      label: "Paid revenue",
      value: formatCurrency(summary?.totalPaidRevenue),
      detail: "Confirmed paid invoices",
      icon: FiDollarSign,
      tone: "blue",
    },
    {
      label: "Forecast",
      value: forecastInsightError ? "N/A" : formatCurrency(totalForecastSales),
      detail: forecastInsightError || "Next 7 days",
      icon: FiTrendingUp,
      tone: "indigo",
    },
    {
      label: "Sales orders",
      value:
        summary?.totalSalesOrders ||
        salesStatusData.reduce((sum, row) => sum + row.count, 0),
      detail: "Total order records",
      icon: FiShoppingCart,
      tone: "slate",
    },
    {
      label: "Action queue",
      value: priorityTotal,
      detail: "Items needing review",
      icon: FiAlertTriangle,
      tone: priorityTotal > 0 ? "amber" : "green",
    },
    {
      label: "Stock risk",
      value: lowStockCount,
      detail: "Low stock products",
      icon: FiBox,
      tone: lowStockCount > 0 ? "amber" : "green",
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
      hint: "Review reorder levels",
    },
    {
      label: "Pending invoices",
      value: pendingInvoices,
      icon: FiFileText,
      to: "/invoices",
      hint: "Follow up payment status",
    },
    {
      label: "Pending receipts",
      value: pendingReceipts,
      icon: FiShoppingBag,
      to: "/purchase-orders",
      hint: "Receive supplier deliveries",
    },
    {
      label: "Pending approvals",
      value: pendingApprovals,
      icon: FiShield,
      to: "/approvals",
      hint: "Review stock adjustments",
    },
  ];

  return (
    <section className="msdash-page">
      <div className="msdash-shell">
        <header className="msdash-command-bar">
          <div>
            <span className="msdash-eyebrow">Business intelligence</span>
            <h1>Operations overview</h1>
            <p>
              A single-page report canvas for revenue, forecast, stock risk,
              procurement, customers, and security activity across CoreFlow.
            </p>
          </div>

          <div className="msdash-command-actions">
            <button
              type="button"
              className="msdash-secondary-button"
              onClick={() => setIsCustomizeOpen(true)}
            >
              <FiSettings />
              Customize dashboard
            </button>

            <button
              type="button"
              className="msdash-secondary-button"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              <FiRefreshCw />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="msdash-filter-bar" aria-label="Dashboard slicers">
          <div>
            <span>Report slicers</span>
            <strong>Canvas controls</strong>
          </div>

          <label>
            Revenue range
            <select
              value={trendRange}
              onChange={(event) => setTrendRange(event.target.value)}
            >
              <option value="7">Last 7 data points</option>
              <option value="14">Last 14 data points</option>
              <option value="30">Last 30 data points</option>
            </select>
          </label>

          <div className="msdash-widget-count">
            <FiGrid />
            <span>{visibleWidgetCount} widgets visible</span>
          </div>
        </section>

        <section className="msdash-kpi-strip" aria-label="Dashboard metrics">
          {kpiCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.label} className={`msdash-kpi-card ${card.tone}`}>
                <div className="msdash-kpi-icon">
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
        </section>

        {visibleWidgetCount === 0 ? (
          <section className="msdash-empty-canvas">
            <FiGrid />
            <h2>No widgets visible</h2>
            <p>
              Open Customize dashboard and add report widgets back to the canvas.
            </p>

            <button
              type="button"
              className="msdash-secondary-button"
              onClick={resetWidgets}
            >
              Reset dashboard
            </button>
          </section>
        ) : (
          <div className="msdash-report-grid">
            {isWidgetVisible("revenueTrend") && (
              <ReportCard
                id="revenueTrend"
                eyebrow="Revenue"
                title="Revenue trend"
                className="msdash-span-8"
                action={<small>{trendRange} data points</small>}
              >
                <div className="msdash-chart-body large">
                  {visibleSalesTrend.length === 0 ? (
                    <div className="msdash-empty-state">
                      <FiTrendingUp />
                      <p>Create sales orders across different dates to show trend.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={290}>
                      <AreaChart
                        data={visibleSalesTrend}
                        margin={{ top: 8, right: 18, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="msRevenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={chartColors.blue}
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="95%"
                              stopColor={chartColors.blue}
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={chartColors.blue}
                          strokeWidth={2.5}
                          fill="url(#msRevenueGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("actionQueue") && (
              <ReportCard
                id="actionQueue"
                eyebrow="Action queue"
                title="Needs attention"
                className="msdash-span-4"
                action={<strong>{priorityTotal}</strong>}
              >
                <div className="msdash-action-list">
                  {priorityItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link key={item.label} to={item.to} className="msdash-action-row">
                        <div className="msdash-action-icon">
                          <Icon />
                        </div>

                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.hint}</p>
                        </div>

                        <span>{item.value}</span>
                      </Link>
                    );
                  })}
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("forecastTrend") && (
              <ReportCard
                id="forecastTrend"
                eyebrow="Forecast"
                title="Next 7 days"
                className="msdash-span-6"
                action={<FiTrendingUp />}
              >
                <div className="msdash-chart-body">
                  {forecastItems.length === 0 ? (
                    <div className="msdash-empty-state">
                      <FiAlertTriangle />
                      <p>{forecastInsightError || "Forecast data unavailable."}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <AreaChart
                        data={forecastItems}
                        margin={{ top: 8, right: 18, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="msForecastGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={chartColors.indigo}
                              stopOpacity={0.24}
                            />
                            <stop
                              offset="95%"
                              stopColor={chartColors.indigo}
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted_sales"
                          stroke={chartColors.indigo}
                          strokeWidth={2.5}
                          fill="url(#msForecastGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("salesStatus") && (
              <ReportCard
                id="salesStatus"
                eyebrow="Sales orders"
                title="Status distribution"
                className="msdash-span-6"
                action={<FiShoppingCart />}
              >
                <div className="msdash-chart-body">
                  {salesStatusData.length === 0 ? (
                    <div className="msdash-empty-state">
                      <p>No sales order status data.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={salesStatusData}
                        layout="vertical"
                        margin={{ top: 8, right: 18, left: 18, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          width={110}
                          tick={{ fontSize: 12, fill: "#64748b" }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {salesStatusData.map((entry, index) => (
                            <Cell
                              key={entry.label}
                              fill={
                                [
                                  chartColors.blue,
                                  chartColors.green,
                                  chartColors.amber,
                                  chartColors.indigo,
                                  chartColors.red,
                                ][index % 5]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("procurement") && (
              <ReportCard
                id="procurement"
                eyebrow="Procurement"
                title="Purchase order status"
                className="msdash-span-4"
                action={<FiTruck />}
              >
                <div className="msdash-chart-body compact">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={purchaseOrderStatusData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar
                        dataKey="count"
                        fill={chartColors.blue}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("inventoryRisk") && (
              <ReportCard
                id="inventoryRisk"
                eyebrow="Inventory"
                title="Stock risk"
                className="msdash-span-4"
                action={<FiBox />}
              >
                <div className="msdash-chart-body compact">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={inventoryRiskData}
                      layout="vertical"
                      margin={{ top: 8, right: 18, left: 18, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        width={85}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {inventoryRiskData.map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={
                              entry.label === "Low stock"
                                ? chartColors.red
                                : entry.label === "Watch"
                                ? chartColors.amber
                                : chartColors.green
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("customerRisk") && (
              <ReportCard
                id="customerRisk"
                eyebrow="Customers"
                title="Activity risk"
                className="msdash-span-4"
                action={<FiUsers />}
              >
                <div className="msdash-chart-body compact">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={customerActivityData}
                      layout="vertical"
                      margin={{ top: 8, right: 18, left: 18, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        width={90}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {customerActivityData.map((entry, index) => (
                          <Cell
                            key={entry.label}
                            fill={
                              [
                                chartColors.blue,
                                chartColors.green,
                                chartColors.amber,
                                chartColors.red,
                              ][index % 4]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("topProducts") && (
              <ReportCard
                id="topProducts"
                eyebrow="Products"
                title="Top selling products"
                className="msdash-span-8"
                action={<FiBarChart2 />}
              >
                <div className="msdash-chart-body top-products">
                  {topProductChartData.length === 0 ? (
                    <div className="msdash-empty-state">
                      <p>No product sales data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topProductChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 26, left: 30, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          width={190}
                          tick={{ fontSize: 12, fill: "#111827" }}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name, item) => [
                            `${value} sold · ${formatCurrency(item.payload.revenue)}`,
                            "Product",
                          ]}
                        />
                        <Bar
                          dataKey="quantity_sold"
                          fill={chartColors.blue}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ReportCard>
            )}

            {isWidgetVisible("auditTrail") && (
              <ReportCard
                id="auditTrail"
                eyebrow="Audit trail"
                title="Recent activity"
                className="msdash-span-4"
                action={
                  <Link to="/audit-logs">
                    View
                    <FiArrowRight />
                  </Link>
                }
              >
                <div className="msdash-activity-list">
                  {recentActivity.length === 0 ? (
                    <div className="msdash-empty-state">
                      <FiClock />
                      <p>No recent activity.</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 7).map((activity) => (
                      <div key={activity.id} className="msdash-activity-row">
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
              </ReportCard>
            )}
          </div>
        )}

        {isCustomizeOpen && (
          <div
            className="msdash-drawer-backdrop"
            onClick={() => setIsCustomizeOpen(false)}
          >
            <aside
              className="msdash-customize-drawer"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="msdash-drawer-header">
                <div>
                  <span>Dashboard canvas</span>
                  <h2>Customize widgets</h2>
                  <p>Show or hide report tiles. Your layout is saved locally.</p>
                </div>

                <button
                  type="button"
                  className="msdash-icon-button"
                  onClick={() => setIsCustomizeOpen(false)}
                  aria-label="Close customize dashboard"
                >
                  <FiX />
                </button>
              </div>

              <div className="msdash-widget-list">
                {widgetDefinitions.map((widget) => {
                  const isVisible = isWidgetVisible(widget.id);

                  return (
                    <button
                      key={widget.id}
                      type="button"
                      className={`msdash-widget-toggle ${
                        isVisible ? "active" : ""
                      }`}
                      onClick={() => toggleWidget(widget.id)}
                    >
                      <span>
                        {isVisible ? <FiEye /> : <FiEyeOff />}
                      </span>

                      <div>
                        <strong>{widget.title}</strong>
                        <p>{widget.description}</p>
                      </div>

                      <em>{isVisible ? "Shown" : "Hidden"}</em>
                    </button>
                  );
                })}
              </div>

              <div className="msdash-drawer-footer">
                <button
                  type="button"
                  className="msdash-secondary-button"
                  onClick={resetWidgets}
                >
                  Reset dashboard
                </button>

                <button
                  type="button"
                  className="msdash-primary-button"
                  onClick={() => setIsCustomizeOpen(false)}
                >
                  Done
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
