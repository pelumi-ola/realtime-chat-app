import express from "express";
import {
  getUserById,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validationMiddleware.js";
import { param, body } from "express-validator";

const router = express.Router();

router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid user ID"),
  validateRequest,
  getUserById,
);

router.patch(
  "/profile",
  protect,
  [
    body("firstName")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 50 }),

    body("lastName")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 50 }),

    body("userName").optional().isString().trim().isLength({ min: 3, max: 30 }),
  ],
  validateRequest,
  updateUserProfile,
);

export default router;
