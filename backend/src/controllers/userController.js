import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createUser(req, res, next) {
  const client = await pool.connect();

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, password, and role are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long",
      });
    }

    const normalisedEmail = email.toLowerCase().trim();
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

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [normalisedEmail]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserResult = await client.query(
      `INSERT INTO users (
        name, 
        email, 
        password_hash, 
        role_id, 
        status, 
        must_change_password
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
        id, 
        name, 
        email, 
        status, 
        must_change_password,
        password_changed_at,
        last_login_at, 
        created_at, 
        updated_at`,
      [
        name.trim(),
        normalisedEmail,
        passwordHash,
        roleResult.rows[0].id,
        "active",
        true,
      ]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "CREATE_USER",
        module: "users",
        entityType: "user",
        entityId: newUserResult.rows[0].id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user: {
          ...newUserResult.rows[0],
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

export async function getUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.status,
         users.must_change_password,
         users.password_changed_at,
         users.last_login_at,
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