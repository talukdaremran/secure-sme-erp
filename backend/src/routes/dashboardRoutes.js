import express from "express";
import {
  getDashboardBi,
  getDashboardSummary,
} from "../controllers/dashboardController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, authorizeRoles("Admin"), getDashboardSummary);
router.get("/bi", protect, authorizeRoles("Admin"), getDashboardBi);

export default router;