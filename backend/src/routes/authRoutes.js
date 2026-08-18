import express from "express";

import { 
    loginUser, 
    getCurrentUser,
    changePassword,
} from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);

router.get("/me", protect, getCurrentUser);

router.patch("/change-password", protect, changePassword);

router.get("/admin-check", protect, authorizeRoles("Admin"), (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Admin access confirmed",
    });
});

export default router;