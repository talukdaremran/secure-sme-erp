import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCpu,
  FiDollarSign,
  FiRefreshCw,
  FiTrendingUp,
  FiCheckCircle,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

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
    await checkAiHealth();
    await fetchSalesForecast();
    await fetchAuditAnomalies();
    await fetchCustomerActivityPredictions();
  }

  useEffect(() => {
    checkAiHealth();
    fetchSalesForecast();
    fetchAuditAnomalies();
    fetchCustomerActivityPredictions();
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

  const isConnected = Boolean(aiStatus?.connected);
  const forecastResult = forecastData?.result;
  const forecastItems = forecastResult?.forecast || [];
  const trainingData = forecastResult?.training_data || forecastData?.salesHistory || [];

  const totalPredictedSales = forecastItems.reduce((sum, item) => {
    return sum + Number(item.predicted_sales || 0);
  }, 0);

  const averagePredictedSales =
    forecastItems.length > 0 ? totalPredictedSales / forecastItems.length : 0;

  const maxPredictedSales = Math.max(
    ...forecastItems.map((item) => Number(item.predicted_sales || 0)),
    1
  );

  const anomalyResult = anomalyData?.result;
  const anomalies = anomalyResult?.anomalies || [];
  const anomalySummary = anomalyResult?.summary || {
    high: 0,
    medium: 0,
    low: 0,
  };

  function getSeverityBadgeClass(severity) {
    if (severity === "high") {
      return "badge badge-danger";
    }

    if (severity === "medium") {
      return "badge badge-warning";
    }

    return "badge badge-info";
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
      return "badge badge-success";
    }

    if (status === "at_risk") {
      return "badge badge-warning";
    }

    return "badge badge-danger";
  }

  function formatActivityStatus(status) {
    if (status === "at_risk") {
      return "At Risk";
    }

    if (status === "active") {
      return "Active";
    }

    if (status === "inactive") {
      return "Inactive";
    }

    return "-";
  }

  return (
    <section>
      <div className="ai-hero">
        <div className="ai-hero-main">
          <span className="hero-kicker">Intelligence Hub</span>

          <h1>AI Insights for Operations</h1>

          <p>
            Forecast sales, detect suspicious activity, and identify customer activity
            risk using data from the ERP workflow.
          </p>

          <div className="ai-hero-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={refreshAiAnalytics}
              disabled={
                checking ||
                forecastLoading ||
                anomalyLoading ||
                customerActivityLoading
              }
            >
              <FiRefreshCw />
              {checking || forecastLoading || anomalyLoading || customerActivityLoading
                ? "Refreshing..."
                : "Refresh Insights"}
            </button>

            <span className={isConnected ? "ai-live-pill connected" : "ai-live-pill offline"}>
              {healthLoading ? "Checking AI Service" : isConnected ? "AI Service Live" : "AI Service Offline"}
            </span>
          </div>
        </div>

        <div className="ai-hero-panel">
          <div className="ai-service-mini-card">
            <div
              className={`ai-connection-icon ${
                isConnected ? "ai-connected" : "ai-disconnected"
              }`}
            >
              {isConnected ? <FiCpu /> : <FiAlertTriangle />}
            </div>

            <div>
              <span>Python FastAPI Service</span>
              <strong>
                {healthLoading
                  ? "Checking..."
                  : isConnected
                  ? "Connected"
                  : "Offline"}
              </strong>
              <p>{aiStatus?.aiServiceUrl || "Service URL unavailable"}</p>
            </div>
          </div>
        </div>
      </div>

      {healthError && <p className="message error-message">{healthError}</p>}
      {forecastError && <p className="message error-message">{forecastError}</p>}
      {anomalyError && <p className="message error-message">{anomalyError}</p>}
      {customerActivityError && (
        <p className="message error-message">{customerActivityError}</p>
      )}

      <div className="ai-module-grid">
        <article className="ai-module-card">
          <div className="ai-module-icon sales">
            <FiTrendingUp />
          </div>

          <div>
            <span>Sales Forecast</span>
            <strong>{formatCurrency(totalPredictedSales)}</strong>
            <p>Predicted 7-day revenue</p>
          </div>
        </article>

        <article className="ai-module-card">
          <div className="ai-module-icon security">
            <FiShield />
          </div>

          <div>
            <span>Security Anomalies</span>
            <strong>{anomalySummary.high}</strong>
            <p>High severity findings</p>
          </div>
        </article>

        <article className="ai-module-card">
          <div className="ai-module-icon customers">
            <FiUsers />
          </div>

          <div>
            <span>Customer Risk</span>
            <strong>{customerActivitySummary.at_risk}</strong>
            <p>Customers marked at risk</p>
          </div>
        </article>

        <article className="ai-module-card">
          <div className="ai-module-icon model">
            <FiActivity />
          </div>

          <div>
            <span>Active Models</span>
            <strong>3</strong>
            <p>Forecasting, anomaly, activity</p>
          </div>
        </article>
      </div>

      {healthError && <p className="message error-message">{healthError}</p>}
      {forecastError && <p className="message error-message">{forecastError}</p>}
      {anomalyError && <p className="message error-message">{anomalyError}</p>}
      {customerActivityError && (
        <p className="message error-message">{customerActivityError}</p>
      )}

      <div className="dashboard-metric-grid">
        <article
          className={`dashboard-metric-card ${
            isConnected ? "metric-green" : "metric-red"
          }`}
        >
          <div className="metric-icon">
            <FiCpu />
          </div>

          <div>
            <span>AI Service Status</span>
            <strong>
              {healthLoading
                ? "Checking..."
                : isConnected
                ? "Connected"
                : "Offline"}
            </strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiActivity />
          </div>

          <div>
            <span>Model</span>
            <strong>{forecastResult?.model || "LinearRegression"}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-green">
          <div className="metric-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>7-Day Forecast Total</span>
            <strong>{formatCurrency(totalPredictedSales)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiTrendingUp />
          </div>

          <div>
            <span>Average Daily Forecast</span>
            <strong>{formatCurrency(averagePredictedSales)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-red">
          <div className="metric-icon">
            <FiShield />
          </div>

          <div>
            <span>High Risk Anomalies</span>
            <strong>{anomalySummary.high}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-orange">
          <div className="metric-icon">
            <FiUsers />
          </div>

          <div>
            <span>At-Risk Customers</span>
            <strong>{customerActivitySummary.at_risk}</strong>
          </div>
        </article>
      </div>

      <section className="table-card ai-status-card">
        <div className="table-card-header">
          <div>
            <h2>Sales Forecast</h2>
            <p>
              Forecast future daily sales using historical completed sales
              orders.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => fetchSalesForecast(7)}
            disabled={forecastLoading}
          >
            <FiBarChart2 />
            {forecastLoading ? "Generating..." : "Generate Forecast"}
          </button>
        </div>

        <div className="panel-body">
          {forecastLoading ? (
            <p>Generating sales forecast...</p>
          ) : forecastError ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>Forecast unavailable</h3>
              <p>{forecastError}</p>
              <p>
                At least two different sales dates are required for forecasting.
              </p>
            </div>
          ) : forecastItems.length === 0 ? (
            <div className="empty-state">
              <FiBarChart2 />
              <h3>No forecast data available</h3>
              <p>Create completed sales orders on at least two dates.</p>
            </div>
          ) : (
            <>
              <div className="ai-forecast-summary">
                <article>
                  <span>History Points</span>
                  <strong>{forecastResult?.history_points || 0}</strong>
                </article>

                <article>
                  <span>Forecast Days</span>
                  <strong>{forecastResult?.forecast_days || 7}</strong>
                </article>

                <article>
                  <span>Model Used</span>
                  <strong>{forecastResult?.model}</strong>
                </article>
              </div>

              <div className="ai-forecast-chart">
                {forecastItems.map((item) => {
                  const predictedSales = Number(item.predicted_sales || 0);
                  const barWidth = Math.max(
                    (predictedSales / maxPredictedSales) * 100,
                    4
                  );

                  return (
                    <div className="ai-forecast-row" key={item.date}>
                      <span>{formatDate(item.date)}</span>

                      <div className="ai-forecast-bar-track">
                        <div
                          className="ai-forecast-bar"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <strong>{formatCurrency(predictedSales)}</strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="table-card ai-status-card">
        <div className="table-card-header">
          <div>
            <h2>Audit Log Anomaly Detection</h2>
            <p>
              Analyse recent audit logs for suspicious patterns such as repeated
              failed logins, risky actions, and unusual activity.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => fetchAuditAnomalies(100)}
            disabled={anomalyLoading}
          >
            <FiShield />
            {anomalyLoading ? "Analysing..." : "Analyse Logs"}
          </button>
        </div>

        <div className="panel-body">
          {anomalyLoading ? (
            <p>Analysing audit logs...</p>
          ) : anomalyError ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>Anomaly detection unavailable</h3>
              <p>{anomalyError}</p>
            </div>
          ) : anomalies.length === 0 ? (
            <div className="empty-state">
              <FiCheckCircle />
              <h3>No suspicious activity detected</h3>
              <p>
                The AI service analysed recent audit logs and did not find suspicious
                patterns based on the current detection rules.
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
                  <span>Logs Analysed</span>
                  <strong>{anomalyResult?.logs_analysed || 0}</strong>
                </article>
              </div>

              <div className="ai-anomaly-list">
                {anomalies.map((anomaly, index) => (
                  <article className="ai-anomaly-card" key={`${anomaly.type}-${index}`}>
                    <div className="ai-anomaly-card-header">
                      <div>
                        <span className={getSeverityBadgeClass(anomaly.severity)}>
                          {String(anomaly.severity).toUpperCase()}
                        </span>
                        <h3>{anomaly.title}</h3>
                      </div>

                      <FiAlertTriangle />
                    </div>

                    <p>{anomaly.description}</p>

                    {anomaly.evidence && (
                      <div className="ai-anomaly-evidence">
                        <strong>Evidence</strong>

                        {Object.entries(anomaly.evidence).map(([key, value]) => (
                          <span key={key}>
                            {key.replaceAll("_", " ")}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}

                    {anomaly.recommendation && (
                      <p className="ai-anomaly-recommendation">
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="table-card ai-status-card">
        <div className="table-card-header">
          <div>
            <h2>Customer Activity Prediction</h2>
            <p>
              Analyse customer order history and classify customers as active, at
              risk, or inactive.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={fetchCustomerActivityPredictions}
            disabled={customerActivityLoading}
          >
            <FiUsers />
            {customerActivityLoading ? "Predicting..." : "Predict Activity"}
          </button>
        </div>

        <div className="panel-body">
          {customerActivityLoading ? (
            <p>Analysing customer activity...</p>
          ) : customerActivityError ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>Customer prediction unavailable</h3>
              <p>{customerActivityError}</p>
            </div>
          ) : customerPredictions.length === 0 ? (
            <div className="empty-state">
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
                  <span>At Risk</span>
                  <strong>{customerActivitySummary.at_risk}</strong>
                </article>

                <article className="customer-inactive">
                  <span>Inactive</span>
                  <strong>{customerActivitySummary.inactive}</strong>
                </article>

                <article>
                  <span>Customers Analysed</span>
                  <strong>{customerActivityResult?.customers_analysed || 0}</strong>
                </article>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Risk Score</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customerPredictions.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td>
                          <div>
                            <strong>{customer.customer_name}</strong>
                            <p className="table-subtext">
                              {customer.customer_email || "-"}
                            </p>
                          </div>
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

              <div className="ai-customer-risk-list">
                {customerPredictions.slice(0, 3).map((customer) => (
                  <article
                    className="ai-customer-risk-card"
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
                      <p>Risk score: {customer.risk_score}/100</p>
                    </div>

                    <ul>
                      {customer.risk_reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Training Data Used</h2>
            <p>
              Daily sales totals collected from completed sales orders in the
              ERP database.
            </p>
          </div>
        </div>

        <div className="panel-body">
          {trainingData.length === 0 ? (
            <p>No training data available yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Sales</th>
                    <th>Order Count</th>
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
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>AI Modules Summary</h2>
            <p>
              The system combines operational ERP data with a separate Python AI
              service for decision-support insights.
            </p>
          </div>
        </div>

        <div className="panel-body">
          <div className="ai-feature-grid">
            <article className="ai-feature-card">
              <FiTrendingUp />
              <h3>Sales Forecasting</h3>
              <p>
                Uses historical completed sales orders to predict short-term sales
                trends.
              </p>
            </article>

            <article className="ai-feature-card">
              <FiAlertTriangle />
              <h3>Audit Anomaly Detection</h3>
              <p>
                Reviews audit logs for suspicious behaviour such as repeated failed
                logins and risky actions.
              </p>
            </article>

            <article className="ai-feature-card">
              <FiUsers />
              <h3>Customer Activity Prediction</h3>
              <p>
                Classifies customers as active, at risk, or inactive based on order
                behaviour.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  );
}

export default AiAnalyticsPage;