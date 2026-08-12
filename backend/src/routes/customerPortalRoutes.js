import express from "express";
import {
  createCustomerPortalOrder,
  getCustomerPortalOrders,
  getCustomerPortalProducts,
} from "../controllers/customerPortalController.js";
import { protectPortal } from "../middleware/portalAuthMiddleware.js";

const router = express.Router();

router.use(protectPortal);

router.get("/products", getCustomerPortalProducts);
router.get("/orders", getCustomerPortalOrders);
router.post("/orders", createCustomerPortalOrder);

export default router;