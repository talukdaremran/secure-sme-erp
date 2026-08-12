import express from "express";
import {
  getAiServiceHealth,
  getSalesForecast,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/health", getAiServiceHealth);
router.get("/sales-forecast", getSalesForecast);

export default router;