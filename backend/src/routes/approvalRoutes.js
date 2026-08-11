import express from "express";
import {
  approveApprovalRequest,
  createInventoryAdjustmentRequest,
  getApprovalRequests,
  rejectApprovalRequest,
} from "../controllers/approvalController.js";
import {
  authorizeRoles,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/inventory-adjustments",
  createInventoryAdjustmentRequest
);

router.get("/", authorizeRoles("Admin"), getApprovalRequests);

router.patch(
  "/:id/approve",
  authorizeRoles("Admin"),
  approveApprovalRequest
);

router.patch(
  "/:id/reject",
  authorizeRoles("Admin"),
  rejectApprovalRequest
);

export default router;