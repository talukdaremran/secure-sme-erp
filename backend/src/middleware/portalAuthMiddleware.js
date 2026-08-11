import jwt from "jsonwebtoken";
import pool from "../config/db.js";

function getPortalJwtSecret() {
  return process.env.PORTAL_JWT_SECRET || process.env.JWT_SECRET;
}

export async function protectPortal(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Portal authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, getPortalJwtSecret());

    if (decoded.type !== "portal") {
      return res.status(401).json({
        status: "error",
        message: "Invalid portal token",
      });
    }

    const result = await pool.query(
      `SELECT
         id,
         role,
         name,
         email,
         phone,
         customer_id,
         supplier_id,
         email_verified,
         last_login_at,
         created_at
       FROM portal_users
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Portal user no longer exists",
      });
    }

    const portalUser = result.rows[0];

    if (!portalUser.email_verified) {
      return res.status(403).json({
        status: "error",
        message: "Email verification is required",
      });
    }

    req.portalUser = portalUser;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired portal token",
    });
  }
}