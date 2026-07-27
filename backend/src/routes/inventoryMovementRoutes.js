import express from "express";
import {
  getInventoryMovements,
  createInventoryAdjustment,
} from "../controllers/inventoryMovementController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInventoryMovements);
router.post("/", protect, authorizeRoles("Admin"), createInventoryAdjustment);

export default router;