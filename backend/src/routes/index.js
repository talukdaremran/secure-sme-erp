import express from "express";

import pool from "../config/db.js";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import customerRoutes from "./customerRoutes.js";
import salesOrderRoutes from "./salesOrderRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import auditLogRoutes from "./auditLogRoutes.js";
import inventoryMovementRoutes from "./inventoryMovementRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import userRoutes from "./userRoutes.js";
import exportRoutes from "./exportRoutes.js";
import supplierRoutes from "./supplierRoutes.js";

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

router.use("/auth", authRoutes);

router.use("/products", productRoutes);

router.use("/customers", customerRoutes);

router.use("/sales-orders", salesOrderRoutes);

router.use("/invoices", invoiceRoutes);

router.use("/audit-logs", auditLogRoutes);

router.use("/inventory-movements", inventoryMovementRoutes);

router.use("/dashboard", dashboardRoutes);

router.use("/users", userRoutes);

router.use("/exports", exportRoutes);

router.use("/suppliers", supplierRoutes);

export default router;