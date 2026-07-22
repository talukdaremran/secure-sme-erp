import bcrypt from "bcryptjs";
import pool from "../config/db.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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