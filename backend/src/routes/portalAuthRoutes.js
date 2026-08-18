import express from "express";
import {
  getCurrentPortalUser,
  loginPortalUser,
  registerCustomerPortalUser,
  registerSupplierPortalUser,
  verifyPortalEmail,
} from "../controllers/portalAuthController.js";
import { protectPortal } from "../middleware/portalAuthMiddleware.js";

const router = express.Router();

router.post("/customer/register", registerCustomerPortalUser);
router.post("/supplier/register", registerSupplierPortalUser);
router.post("/verify-email", verifyPortalEmail);
router.post("/login", loginPortalUser);
router.get("/me", protectPortal, getCurrentPortalUser);

export default router;