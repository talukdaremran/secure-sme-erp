import express from "express";
import {
  createUser,
  getUsers,
  updateUserRole,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("Admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);

export default router;