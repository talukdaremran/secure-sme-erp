import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, authorizeRoles("Admin"), getDashboardSummary);

export default router;