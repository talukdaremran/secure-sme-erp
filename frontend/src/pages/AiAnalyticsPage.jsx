import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import apiClient from "../api/apiClient";
import "../styles/aiAnalytics.css";

function AiAnalyticsPage() {
  const [aiStatus, setAiStatus] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const [healthLoading, setHealthLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [healthError, setHealthError] = useState("");
  const [forecastError, setForecastError] = useState("");

  const [anomalyData, setAnomalyData] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [anomalyError, setAnomalyError] = useState("");

  const [customerActivityData, setCustomerActivityData] = useState(null);
  const [customerActivityLoading, setCustomerActivityLoading] = useState(true);
  const [customerActivityError, setCustomerActivityError] = useState("");

  async function checkAiHealth() {
    try {
      setChecking(true);
      setHealthError("");

      const response = await apiClient.get("/ai/health");

      setAiStatus(response.data?.data || null);
    } catch (error) {
      setAiStatus(error.response?.data?.data || null);
      setHealthError(
        error.response?.data?.message || "Unable to connect to AI service."
      );
    } finally {
      setHealthLoading(false);
      setChecking(false);
    }
  }

  async function fetchSalesForecast(days = 7) {
    try {
      setForecastLoading(true);
      setForecastError("");

      const response = await apiClient.get(`/ai/sales-forecast?days=${days}`);

      setForecastData(response.data?.data || null);
    } catch (error) {
      setForecastData(error.response?.data?.data || null);
      setForecastError(
        error.response?.data?.message || "Unable to generate sales forecast."
      );
    } finally {
      setForecastLoading(false);
    }
  }

  async function fetchAuditAnomalies(limit = 100) {
    try {
      setAnomalyLoading(true);
      setAnomalyError("");

      const response = await apiClient.get(`/ai/audit-anomalies?limit=${limit}`);

      setAnomalyData(response.data?.data || null);
    } catch (error) {
      setAnomalyData(error.response?.data?.data || null);
      setAnomalyError(
        error.response?.data?.message || "Unable to analyse audit logs."
      );
    } finally {
      setAnomalyLoading(false);
    }
  }

  async function fetchCustomerActivityPredictions() {
    try {
      setCustomerActivityLoading(true);
      setCustomerActivityError("");

      const response = await apiClient.get("/ai/customer-activity");

      setCustomerActivityData(response.data?.data || null);
    } catch (error) {
      setCustomerActivityData(error.response?.data?.data || null);
      setCustomerActivityError(
        error.response?.data?.message ||
          "Unable to load customer activity predictions."
      );
    } finally {
      setCustomerActivityLoading(false);
    }
  }

  async function refreshAiAnalytics() {
    await Promise.all([
      checkAiHealth(),
      fetchSalesForecast(),
      fetchAuditAnomalies(),
      fetchCustomerActivityPredictions(),
    ]);
  }

  useEffect(() => {
    refreshAiAnalytics();
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

    return new Date(value).toLocaleDateString();
  }

  function formatChartDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
    });
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

  function ForecastTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="ai-chart-tooltip">
        <span>{label}</span>
        <strong>{formatCurrency(payload[0].value)}</strong>
      </div>
    );
  }

  const isConnected = Boolean(aiStatus?.connected);
  const isRefreshing =
    checking || forecastLoading || anomalyLoading || customerActivityLoading;

  const forecastResult = forecastData?.result;
  const forecastItems = forecastResult?.forecast || [];
  const trainingData =
    forecastResult?.training_data || forecastData?.salesHistory || [];

  const forecastChartData = forecastItems.map((item) => ({
    date: formatChartDate(item.date),
    fullDate: formatDate(item.date),
    predictedSales: Number(item.predicted_sales || 0),
  }));

  const totalPredictedSales = forecastItems.reduce((sum, item) => {
    return sum + Number(item.predicted_sales || 0);
  }, 0);

  const averagePredictedSales =
    forecastItems.length > 0 ? totalPredictedSales / forecastItems.length : 0;

  const anomalyResult = anomalyData?.result;
  const anomalies = anomalyResult?.anomalies || [];
  const anomalySummary = anomalyResult?.summary || {
    high: 0,
    medium: 0,
    low: 0,
  };

  function getSeverityBadgeClass(severity) {
    if (severity === "high") {
      return "ai-severity-pill severity-high";
    }

    if (severity === "medium") {
      return "ai-severity-pill severity-medium";
    }

    return "ai-severity-pill severity-low";
  }

  const customerActivityResult = customerActivityData?.result;
  const customerPredictions = customerActivityResult?.predictions || [];
  const customerActivitySummary = customerActivityResult?.summary || {
    active: 0,
    at_risk: 0,
    inactive: 0,
  };

  function getCustomerActivityBadgeClass(status) {
    if (status === "active") {
      return "ai-customer-status-pill customer-active";
    }

    if (status === "at_risk") {
      return "ai-customer-status-pill customer-risk";
    }

    return "ai-customer-status-pill customer-inactive";
  }

  function formatActivityStatus(status) {
    if (status === "at_risk") {
      return "At risk";
    }

    if (status === "active") {
      return "Active";
    }

    if (status === "inactive") {
      return "Inactive";
    }

    return "-";
  }

  const atRiskCustomers = customerPredictions.filter((customer) => {
    return customer.activity_status === "at_risk";
  });

  const highlightedCustomers =
    atRiskCustomers.length > 0
      ? atRiskCustomers.slice(0, 4)
      : customerPredictions.slice(0, 4);

  return (
    <section className="ai-page">
      <header className="ai-command-bar">
        <div>
          <span className="ai-eyebrow">Intelligence hub</span>
          <h1>AI analytics</h1>
          <p>
            Review AI-assisted sales forecasting, audit anomaly detection, and
            customer activity prediction from operational ERP data.
          </p>
        </div>

        <div className="ai-command-actions">
          <span
            className={
              isConnected
                ? "ai-service-pill connected"
                : "ai-service-pill offline"
            }
          >
            {healthLoading
              ? "Checking service"
              : isConnected
              ? "AI service live"
              : "AI service offline"}
          </span>

          <button
            type="button"
            className="ai-secondary-command"
            onClick={refreshAiAnalytics}
            disabled={isRefreshing}
          >
            <FiRefreshCw />
            {isRefreshing ? "Refreshing..." : "Refresh insights"}
          </button>
        </div>
      </header>

      {(healthError || forecastError || anomalyError || customerActivityError) && (
        <div className="ai-message-stack">
          {healthError && <p className="message error-message">{healthError}</p>}
          {forecastError && (
            <p className="message error-message">{forecastError}</p>
          )}
          {anomalyError && <p className="message error-message">{anomalyError}</p>}
          {customerActivityError && (
            <p className="message error-message">{customerActivityError}</p>
          )}
        </div>
      )}

      <section className="ai-kpi-strip" aria-label="AI analytics metrics">
        <article
          className={isConnected ? "ai-kpi-card success" : "ai-kpi-card danger"}
        >
          <div className="ai-kpi-icon">
            {isConnected ? <FiCpu /> : <FiAlertTriangle />}
          </div>

          <div>
            <span>AI service</span>
            <strong>
              {healthLoading ? "..." : isConnected ? "Connected" : "Offline"}
            </strong>
            <p>{aiStatus?.aiServiceUrl || "Service URL unavailable"}</p>
          </div>
        </article>

        <article className="ai-kpi-card">
          <div className="ai-kpi-icon">
            <FiTrendingUp />
          </div>

          <div>
            <span>7-day forecast</span>
            <strong>
              {forecastLoading ? "..." : formatCurrency(totalPredictedSales)}
            </strong>
            <p>{forecastItems.length || 0} forecast day(s)</p>
          </div>
        </article>

        <article className="ai-kpi-card">
          <div className="ai-kpi-icon">
            <FiBarChart2 />
          </div>

          <div>
            <span>Average daily forecast</span>
            <strong>
              {forecastLoading ? "..." : formatCurrency(averagePredictedSales)}
            </strong>
            <p>{trainingData.length || 0} training point(s)</p>
          </div>
        </article>

        <article className="ai-kpi-card danger">
          <div className="ai-kpi-icon">
            <FiShield />
          </div>

          <div>
            <span>High anomalies</span>
            <strong>{anomalyLoading ? "..." : anomalySummary.high}</strong>
            <p>{anomalies.length || 0} total finding(s)</p>
          </div>
        </article>

        <article className="ai-kpi-card warning">
          <div className="ai-kpi-icon">
            <FiUsers />
          </div>

          <div>
            <span>Customers at risk</span>
            <strong>
              {customerActivityLoading
                ? "..."
                : customerActivitySummary.at_risk}
            </strong>
            <p>{customerActivityResult?.customers_analysed || 0} analysed</p>
          </div>
        </article>

        <article className="ai-kpi-card info">
          <div className="ai-kpi-icon">
            <FiActivity />
          </div>

          <div>
            <span>AI modules</span>
            <strong>3</strong>
            <p>Forecast, anomaly, customer risk</p>
          </div>
        </article>
      </section>

      <section className="ai-status-strip">
        <article>
          <span>Service connection</span>
          <strong>Python FastAPI service</strong>
          <p>
            React calls the Node/Express backend, which forwards AI requests to
            the Python service.
          </p>
        </article>

        <article>
          <span>Decision support</span>
          <strong>Operational AI modules</strong>
          <p>
            Forecast sales, review suspicious audit patterns, and classify
            customer activity risk.
          </p>
        </article>
      </section>

      <section className="ai-panel ai-forecast-panel">
        <div className="ai-panel-header">
          <div>
            <span>Sales forecasting</span>
            <h2>7-day revenue forecast</h2>
            <p>
              A line chart is better here than progress bars because this is a
              time-series forecast.
            </p>
          </div>

          <button
            type="button"
            className="ai-secondary-command"
            onClick={() => fetchSalesForecast(7)}
            disabled={forecastLoading}
          >
            <FiBarChart2 />
            {forecastLoading ? "Generating..." : "Generate forecast"}
          </button>
        </div>

        <div className="ai-panel-body">
          {forecastLoading ? (
            <div className="ai-loading-state">
              <FiBarChart2 />
              <h3>Generating forecast</h3>
              <p>Please wait while the AI service analyses sales history.</p>
            </div>
          ) : forecastError ? (
            <div className="ai-empty-state">
              <FiAlertTriangle />
              <h3>Forecast unavailable</h3>
              <p>{forecastError}</p>
              <p>At least two different sales dates are required for forecasting.</p>
            </div>
          ) : forecastItems.length === 0 ? (
            <div className="ai-empty-state">
              <FiBarChart2 />
              <h3>No forecast data available</h3>
              <p>Create completed sales orders on at least two dates.</p>
            </div>
          ) : (
            <>
              <div className="ai-forecast-summary">
                <article>
                  <span>History points</span>
                  <strong>{forecastResult?.history_points || 0}</strong>
                </article>

                <article>
                  <span>Forecast days</span>
                  <strong>{forecastResult?.forecast_days || 7}</strong>
                </article>

                <article>
                  <span>Model used</span>
                  <strong>{forecastResult?.model || "-"}</strong>
                </article>
              </div>

              <div className="ai-line-chart-card">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={forecastChartData}
                    margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="forecastSalesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                      width={78}
                    />
                    <Tooltip content={<ForecastTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="predictedSales"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fill="url(#forecastSalesGradient)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="ai-insight-grid">
        <article className="ai-panel">
          <div className="ai-panel-header">
            <div>
              <span>Audit anomaly detection</span>
              <h2>Security findings</h2>
              <p>Analyse recent audit logs for suspicious patterns.</p>
            </div>

            <button
              type="button"
              className="ai-secondary-command"
              onClick={() => fetchAuditAnomalies(100)}
              disabled={anomalyLoading}
            >
              <FiShield />
              {anomalyLoading ? "Analysing..." : "Analyse logs"}
            </button>
          </div>

          <div className="ai-panel-body">
            {anomalyLoading ? (
              <div className="ai-loading-state compact">
                <FiShield />
                <h3>Analysing audit logs</h3>
                <p>Please wait while recent audit events are reviewed.</p>
              </div>
            ) : anomalyError ? (
              <div className="ai-empty-state compact">
                <FiAlertTriangle />
                <h3>Anomaly detection unavailable</h3>
                <p>{anomalyError}</p>
              </div>
            ) : anomalies.length === 0 ? (
              <div className="ai-empty-state compact">
                <FiCheckCircle />
                <h3>No suspicious activity detected</h3>
                <p>
                  The AI service did not find suspicious patterns in the current
                  audit dataset.
                </p>
              </div>
            ) : (
              <>
                <div className="ai-anomaly-summary">
                  <article className="severity-high">
                    <span>High</span>
                    <strong>{anomalySummary.high}</strong>
                  </article>

                  <article className="severity-medium">
                    <span>Medium</span>
                    <strong>{anomalySummary.medium}</strong>
                  </article>

                  <article className="severity-low">
                    <span>Low</span>
                    <strong>{anomalySummary.low}</strong>
                  </article>

                  <article>
                    <span>Analysed</span>
                    <strong>{anomalyResult?.logs_analysed || 0}</strong>
                  </article>
                </div>

                <div className="ai-anomaly-list">
                  {anomalies.slice(0, 4).map((anomaly, index) => (
                    <article
                      className="ai-anomaly-card"
                      key={`${anomaly.type}-${index}`}
                    >
                      <span className={getSeverityBadgeClass(anomaly.severity)}>
                        {String(anomaly.severity).toUpperCase()}
                      </span>

                      <h3>{anomaly.title}</h3>
                      <p>{anomaly.description}</p>

                      {anomaly.recommendation && (
                        <p className="ai-anomaly-recommendation">
                          <strong>Recommendation:</strong>{" "}
                          {anomaly.recommendation}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>

        <article className="ai-panel">
          <div className="ai-panel-header">
            <div>
              <span>Customer activity prediction</span>
              <h2>Customer risk view</h2>
              <p>Classify customers as active, at risk, or inactive.</p>
            </div>

            <button
              type="button"
              className="ai-secondary-command"
              onClick={fetchCustomerActivityPredictions}
              disabled={customerActivityLoading}
            >
              <FiUsers />
              {customerActivityLoading ? "Predicting..." : "Predict activity"}
            </button>
          </div>

          <div className="ai-panel-body">
            {customerActivityLoading ? (
              <div className="ai-loading-state compact">
                <FiUsers />
                <h3>Analysing customers</h3>
                <p>Please wait while customer activity is predicted.</p>
              </div>
            ) : customerActivityError ? (
              <div className="ai-empty-state compact">
                <FiAlertTriangle />
                <h3>Customer prediction unavailable</h3>
                <p>{customerActivityError}</p>
              </div>
            ) : customerPredictions.length === 0 ? (
              <div className="ai-empty-state compact">
                <FiUsers />
                <h3>No customer activity data available</h3>
                <p>Create customers and sales orders to generate predictions.</p>
              </div>
            ) : (
              <>
                <div className="ai-customer-summary">
                  <article className="customer-active">
                    <span>Active</span>
                    <strong>{customerActivitySummary.active}</strong>
                  </article>

                  <article className="customer-risk">
                    <span>At risk</span>
                    <strong>{customerActivitySummary.at_risk}</strong>
                  </article>

                  <article className="customer-inactive">
                    <span>Inactive</span>
                    <strong>{customerActivitySummary.inactive}</strong>
                  </article>

                  <article>
                    <span>Analysed</span>
                    <strong>{customerActivityResult?.customers_analysed || 0}</strong>
                  </article>
                </div>

                <div className="ai-risk-list">
                  {highlightedCustomers.map((customer) => (
                    <article
                      className="ai-risk-card"
                      key={`risk-${customer.customer_id}`}
                    >
                      <div>
                        <span
                          className={getCustomerActivityBadgeClass(
                            customer.activity_status
                          )}
                        >
                          {formatActivityStatus(customer.activity_status)}
                        </span>

                        <h3>{customer.customer_name}</h3>
                        <p>{customer.customer_email || "-"}</p>
                      </div>

                      <strong>{customer.risk_score}/100</strong>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      <section className="ai-data-grid">
        <article className="ai-panel">
          <div className="ai-panel-header">
            <div>
              <span>Training data</span>
              <h2>Sales history used</h2>
              <p>Daily sales totals collected from completed sales orders.</p>
            </div>
          </div>

          <div className="ai-panel-body">
            {trainingData.length === 0 ? (
              <div className="ai-empty-state small">
                <FiBarChart2 />
                <h3>No training data available</h3>
                <p>Completed sales orders will appear here.</p>
              </div>
            ) : (
              <div className="ai-table-wrapper limited">
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total sales</th>
                      <th>Order count</th>
                    </tr>
                  </thead>

                  <tbody>
                    {trainingData.map((item) => (
                      <tr key={item.date || item.sale_date}>
                        <td>{formatDate(item.date || item.sale_date)}</td>
                        <td>{formatCurrency(item.total_sales)}</td>
                        <td>{item.order_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>

        <article className="ai-panel">
          <div className="ai-panel-header">
            <div>
              <span>Customer predictions</span>
              <h2>Activity prediction table</h2>
              <p>Customer activity classification and recommendation output.</p>
            </div>
          </div>

          <div className="ai-panel-body">
            {customerPredictions.length === 0 ? (
              <div className="ai-empty-state small">
                <FiUsers />
                <h3>No prediction table yet</h3>
                <p>Customer predictions will appear when the model has data.</p>
              </div>
            ) : (
              <div className="ai-table-wrapper limited">
                <table className="ai-table customer-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Risk score</th>
                      <th>Orders</th>
                      <th>Total spent</th>
                      <th>Last order</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customerPredictions.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td>
                          <strong>{customer.customer_name}</strong>
                          <p className="table-subtext">
                            {customer.customer_email || "-"}
                          </p>
                        </td>

                        <td>
                          <span
                            className={getCustomerActivityBadgeClass(
                              customer.activity_status
                            )}
                          >
                            {formatActivityStatus(customer.activity_status)}
                          </span>
                        </td>

                        <td>
                          <strong>{customer.risk_score}/100</strong>
                        </td>

                        <td>{customer.order_count}</td>
                        <td>{formatCurrency(customer.total_spent)}</td>
                        <td>{formatDate(customer.last_order_date)}</td>
                        <td>{customer.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}

export default AiAnalyticsPage;
