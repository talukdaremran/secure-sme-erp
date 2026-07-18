import express from "express";
import cors from "cors";

import pool from "./config/db.js";


const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Secure SME ERP backend is running",
  });
});

app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            status: "success",
            message: "Database connection successful",
            time: result.rows[0].now,
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
        });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});