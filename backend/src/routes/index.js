import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Secure SME ERP backend is running",
  });
});

router.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      status: "success",
      message: "Database connection successful",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

export default router;