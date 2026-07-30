import express from "express";

import {
  exportCustomers,
  exportInvoices,
  exportProducts,
  exportSalesOrders,
} from "../controllers/exportController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/products", protect, exportProducts);
router.get("/customers", protect, exportCustomers);
router.get("/sales-orders", protect, exportSalesOrders);
router.get("/invoices", protect, exportInvoices);

export default router;