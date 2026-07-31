import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

export async function getUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.status,
         users.created_at,
         users.updated_at,
         roles.name AS role
       FROM users
       JOIN roles ON users.role_id = roles.id
       ORDER BY users.id ASC`
    );

    res.status(200).json({
      status: "success",
      data: {
        users: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        status: "error",
        message: "Role is required",
      });
    }

    const normalisedRole = role.trim();

    await client.query("BEGIN");

    const roleResult = await client.query(
      "SELECT id, name FROM roles WHERE name = $1",
      [normalisedRole]
    );

    if (roleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        status: "error",
        message: "Invalid role",
      });
    }

    const userResult = await client.query(
      `SELECT id, name, email, role_id
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const updatedUserResult = await client.query(
      `UPDATE users
       SET role_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, status, created_at, updated_at`,
      [roleResult.rows[0].id, id]
    );

    await createAuditLog({
      userId: req.user.id,
      action: "UPDATE_USER_ROLE",
      module: "users",
      entityType: "user",
      entityId: Number(id),
      result: "success",
    }, client);

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "User role updated successfully",
      data: {
        user: {
          ...updatedUserResult.rows[0],
          role: roleResult.rows[0].name,
        },
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}