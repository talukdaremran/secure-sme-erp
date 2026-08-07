import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// registerUser feature is disabled (Only admin can create users)
export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, and password are required",
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

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalisedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      ["Staff"]
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        status: "error",
        message: "Default Staff role not found",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role_id, status, created_at`,
      [name.trim(), normalisedEmail, passwordHash, roleResult.rows[0].id, "active"]
    );

    await createAuditLog({
      userId: newUser.rows[0].id,
      action: "REGISTER_USER",
      module: "auth",
      entityType: "user",
      entityId: newUser.rows[0].id,
      result: "success",
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: newUser.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    const normalisedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `SELECT 
        users.id, 
        users.name, 
        users.email, 
        users.password_hash, 
        users.status, 
        users.must_change_password,
        users.password_changed_at,
        users.last_login_at,
        users.created_at, 
        roles.name AS role
       FROM users
       JOIN roles ON users.role_id = roles.id
       WHERE users.email = $1`,
      [normalisedEmail]
    );

    if (result.rows.length === 0) {
      await createAuditLog({
        action: "LOGIN_FAILED",
        module: "auth",
        entityType: "user",
        result: "failed",
      });

      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        module: "auth",
        entityType: "user",
        entityId: user.id,
        result: "failed",
      });

      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Account is not active",
      });
    }

    const loginUpdateResult = await pool.query(
      `UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING last_login_at`,
      [user.id]
    );

    const lastLoginAt = loginUpdateResult.rows[0].last_login_at;

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    await createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      module: "auth",
      entityType: "user",
      entityId: user.id,
      result: "success",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          must_change_password: user.must_change_password,
          password_changed_at: user.password_changed_at,
          last_login_at: lastLoginAt,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  const client = await pool.connect();

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 8 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: "error",
        message: "New password must be different from current password",
      });
    }

    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.password_hash,
         users.status,
         users.must_change_password,
         users.created_at,
         roles.name AS role
       FROM users
       JOIN roles ON users.role_id = roles.id
       WHERE users.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updatedUserResult = await client.query(
      `UPDATE users
       SET password_hash = $1,
           must_change_password = false,
           password_changed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         name,
         email,
         status,
         must_change_password,
         password_changed_at,
         created_at,
         updated_at`,
      [newPasswordHash, req.user.id]
    );

    await createAuditLog(
      {
        userId: req.user.id,
        action: "CHANGE_PASSWORD",
        module: "auth",
        entityType: "user",
        entityId: req.user.id,
        result: "success",
      },
      client
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
      data: {
        user: {
          ...updatedUserResult.rows[0],
          role: user.role,
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

export async function getCurrentUser(req, res) {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
}