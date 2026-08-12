import express from "express";
import {
  getSupplierPortalPurchaseOrderById,
  getSupplierPortalPurchaseOrders,
  markSupplierPurchaseOrderDelivered,
} from "../controllers/supplierPortalController.js";
import { protectPortal } from "../middleware/portalAuthMiddleware.js";

const router = express.Router();

router.use(protectPortal);

router.get("/purchase-orders", getSupplierPortalPurchaseOrders);
router.get("/purchase-orders/:id", getSupplierPortalPurchaseOrderById);
router.patch("/purchase-orders/:id/deliver", markSupplierPurchaseOrderDelivered);

export default router;