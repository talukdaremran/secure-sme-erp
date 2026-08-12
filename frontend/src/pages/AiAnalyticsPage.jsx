import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCpu,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

function AiAnalyticsPage() {
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function checkAiHealth() {
    try {
      setChecking(true);
      setError("");

      const response = await apiClient.get("/ai/health");

      setAiStatus(response.data?.data || null);
    } catch (error) {
      setAiStatus(error.response?.data?.data || null);
      setError(
        error.response?.data?.message || "Unable to connect to AI service."
      );
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  useEffect(() => {
    checkAiHealth();
  }, []);

  const isConnected = Boolean(aiStatus?.connected);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>AI Analytics</h1>
          <p>
            Monitor the Python AI service that will support forecasting,
            anomaly detection, and prediction features.
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

      {error && <p className="message error-message">{error}</p>}

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
              {loading ? "Checking..." : isConnected ? "Connected" : "Offline"}
            </strong>
          </div>
        </article>

        <article className="dashboard-metric-card metric-blue">
          <div className="metric-icon">
            <FiActivity />
          </div>

          <div>
            <span>Service Type</span>
            <strong>{aiStatus?.aiService?.service || "AI Service"}</strong>
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
                {loading
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

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Planned AI Features</h2>
            <p>
              These features will be added after the AI service foundation is
              working.
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