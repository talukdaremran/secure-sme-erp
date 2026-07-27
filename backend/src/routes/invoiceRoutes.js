import express from "express";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoicePaymentStatus,
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.patch("/:id/payment-status", updateInvoicePaymentStatus);

export default router;