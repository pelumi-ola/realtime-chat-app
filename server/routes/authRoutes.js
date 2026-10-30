import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  logUserOut,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validationMiddleware.js";
import {
  registerValidator,
  loginValidator,
} from "../validators/authValidator.js";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, registerUser);
router.post("/login", loginValidator, validateRequest, loginUser);
router.get("/me", protect, getUserProfile);
router.post("/logout", protect, logUserOut);

export default router;