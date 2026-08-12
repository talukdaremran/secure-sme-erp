import express from "express";
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  deliverSalesOrder,
} from "../controllers/salesOrderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getSalesOrders);
router.get("/:id", getSalesOrderById);
router.post("/", createSalesOrder);
router.patch("/:id/deliver", deliverSalesOrder);

export default router;