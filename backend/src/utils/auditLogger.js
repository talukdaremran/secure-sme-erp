import pool from "../config/db.js";

export async function createAuditLog({
  userId = null,
  action,
  module,
  entityType = null,
  entityId = null,
  result = "success",
}) {
  await pool.query(
    `INSERT INTO audit_logs 
      (user_id, action, module, entity_type, entity_id, result)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, action, module, entityType, entityId, result]
  );
}