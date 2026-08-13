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

  async function refreshAiAnalytics() {
    await checkAiHealth();
    await fetchSalesForecast();
    await fetchAuditAnomalies();
  }

  useEffect(() => {
    checkAiHealth();
    fetchSalesForecast();
    fetchAuditAnomalies();
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

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>AI Analytics</h1>
          <p>
            Monitor the Python AI service and generate sales forecasts from ERP
            sales order data.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={refreshAiAnalytics}
          disabled={checking || forecastLoading || anomalyLoading}
        >
          <FiRefreshCw />
          {checking || forecastLoading || anomalyLoading ? "Refreshing..." : "Refresh AI Data"}
        </button>
      </div>

      {healthError && <p className="message error-message">{healthError}</p>}
      {forecastError && <p className="message error-message">{forecastError}</p>}
      {anomalyError && <p className="message error-message">{anomalyError}</p>}

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
      </div>

      <section className="table-card ai-status-card">
        <div className="table-card-header">
          <div>
            <h2>AI Service Connection</h2>
            <p>
              This checks whether the Node/Express backend can communicate with
              the Python FastAPI service.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={checkAiHealth}
            disabled={checking}
          >
            <FiRefreshCw />
            {checking ? "Checking..." : "Check Connection"}
          </button>
        </div>

        <div className="panel-body">
          <div className="ai-connection-box">
            <div
              className={`ai-connection-icon ${
                isConnected ? "ai-connected" : "ai-disconnected"
              }`}
            >
              {isConnected ? <FiCpu /> : <FiAlertTriangle />}
            </div>

            <div>
              <h3>
                {healthLoading
                  ? "Checking AI service..."
                  : isConnected
                  ? "AI service is connected"
                  : "AI service is not connected"}
              </h3>

              <p>
                {isConnected
                  ? aiStatus?.aiService?.message ||
                    "The backend successfully connected to the AI service."
                  : "Start the Python AI service and check the connection again."}
              </p>

              <p className="auth-note">
                AI Service URL: {aiStatus?.aiServiceUrl || "Not available"}
              </p>
            </div>
          </div>
        </div>
      </section>

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
            <h2>Planned AI Features</h2>
            <p>
              These features will be added after the sales forecasting endpoint.
            </p>
          </div>
        </div>

        <div className="panel-body">
          <div className="ai-feature-grid">
            <article className="ai-feature-card">
              <FiTrendingUp />
              <h3>Sales Forecasting</h3>
              <p>
                Predict future sales trends using historical sales order data.
              </p>
            </article>

            <article className="ai-feature-card">
              <FiAlertTriangle />
              <h3>Anomaly Detection</h3>
              <p>
                Detect unusual activity patterns in audit logs or business
                transactions.
              </p>
            </article>

            <article className="ai-feature-card">
              <FiActivity />
              <h3>Customer Prediction</h3>
              <p>
                Analyse customer behaviour for future churn or activity
                prediction.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  );
}

export default AiAnalyticsPage;