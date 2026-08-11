import express from "express";
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from "../controllers/purchaseOrderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getPurchaseOrders);
router.get("/:id", getPurchaseOrderById);
router.post("/", createPurchaseOrder);
router.patch("/:id/status", updatePurchaseOrderStatus);

export default router;