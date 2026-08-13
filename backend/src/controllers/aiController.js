import pool from "../config/db.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function getAiServiceHealth(req, res, next) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);

    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "AI service is not responding correctly",
        data: {
          connected: false,
          aiServiceUrl: AI_SERVICE_URL,
        },
      });
    }

    const aiHealth = await response.json();

    res.status(200).json({
      status: "success",
      message: "AI service connection successful",
      data: {
        connected: true,
        aiServiceUrl: AI_SERVICE_URL,
        aiService: aiHealth,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Unable to connect to AI service",
      data: {
        connected: false,
        aiServiceUrl: AI_SERVICE_URL,
        error: error.message,
      },
    });
  }
}

export async function getSalesForecast(req, res, next) {
  try {
    const forecastDays = Math.min(
      Math.max(Number(req.query.days) || 7, 1),
      30
    );

    const salesHistoryResult = await pool.query(
      `SELECT
         DATE(created_at) AS sale_date,
         SUM(total_amount)::float AS total_sales,
         COUNT(*)::int AS order_count
       FROM sales_orders
       WHERE status IN ('confirmed', 'paid', 'delivered')
       GROUP BY DATE(created_at)
       ORDER BY sale_date ASC`
    );

    const salesHistory = salesHistoryResult.rows.map((row) => ({
      sale_date: row.sale_date.toISOString().slice(0, 10),
      total_sales: Number(row.total_sales),
      order_count: Number(row.order_count),
    }));

    if (salesHistory.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "At least 2 days of sales history are required for forecasting",
        data: {
          historyPoints: salesHistory.length,
          salesHistory,
        },
      });
    }

    const response = await fetch(`${AI_SERVICE_URL}/forecast/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sales_history: salesHistory,
        forecast_days: forecastDays,
      }),
    });

    const aiResult = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "AI service failed to generate sales forecast",
        data: aiResult,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Sales forecast generated successfully",
      data: {
        forecastDays,
        historyPoints: salesHistory.length,
        result: aiResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditAnomalies(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 20), 500);

    const auditLogsResult = await pool.query(
      `SELECT
         audit_logs.id,
         audit_logs.user_id,
         users.name AS user_name,
         users.email AS user_email,
         audit_logs.action,
         audit_logs.module,
         audit_logs.result,
         audit_logs.created_at
       FROM audit_logs
       LEFT JOIN users ON audit_logs.user_id = users.id
       ORDER BY audit_logs.created_at DESC
       LIMIT $1`,
      [limit]
    );

    const auditLogs = auditLogsResult.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      action: row.action,
      module: row.module,
      result: row.result,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
    }));

    const response = await fetch(`${AI_SERVICE_URL}/detect/audit-anomalies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audit_logs: auditLogs,
      }),
    });

    const aiResult = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "AI service failed to analyse audit logs",
        data: aiResult,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Audit anomaly detection completed successfully",
      data: {
        logsAnalysed: auditLogs.length,
        result: aiResult,
      },
    });
  } catch (error) {
    next(error);
  }
}