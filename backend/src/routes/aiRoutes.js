import express from "express";
import {
  getAiServiceHealth,
  getSalesForecast,
  getAuditAnomalies,
  getCustomerActivityPrediction,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/health", getAiServiceHealth);
router.get("/sales-forecast", getSalesForecast);
router.get("/audit-anomalies", getAuditAnomalies);
router.get("/customer-activity", getCustomerActivityPrediction);

export default router;