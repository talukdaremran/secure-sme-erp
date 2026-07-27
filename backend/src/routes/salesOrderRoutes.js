import express from "express";
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
} from "../controllers/salesOrderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getSalesOrders);
router.get("/:id", getSalesOrderById);
router.post("/", createSalesOrder);

export default router;