import express from "express";
import { getRoomMessages, deleteMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validationMiddleware.js";
import {
  messageIdValidator,
  messageHistoryValidator,
} from "../validators/messageValidator.js";

const router = express.Router();

router.get(
  "/:roomId/messages",
  protect,
  messageHistoryValidator,
  validateRequest,
  getRoomMessages,
);
router.delete(
  "/:messageId",
  protect,
  messageIdValidator,
  validateRequest,
  deleteMessage,
);

export default router;
