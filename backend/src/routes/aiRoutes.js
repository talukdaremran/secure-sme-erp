import express from "express";
import { getAiServiceHealth } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/health", getAiServiceHealth);

export default router;