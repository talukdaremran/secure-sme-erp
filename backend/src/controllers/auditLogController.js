import pool from "../config/db.js";

export async function getAuditLogs(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         audit_logs.id,
         audit_logs.user_id,
         users.name AS user_name,
         users.email AS user_email,
         audit_logs.action,
         audit_logs.module,
         audit_logs.entity_type,
         audit_logs.entity_id,
         audit_logs.result,
         audit_logs.created_at
       FROM audit_logs
       LEFT JOIN users ON audit_logs.user_id = users.id
       ORDER BY audit_logs.created_at DESC
       LIMIT 100`
    );

    res.status(200).json({
      status: "success",
      data: {
        auditLogs: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}