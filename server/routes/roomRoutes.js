import express from "express";
import {
  createRoom,
  getAllRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  addRoomMember,
  makeRoomAdmin,
  removeRoomAdmin,
  removeRoomMember,
} from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validationMiddleware.js";
import {
  createRoomValidator,
  updateRoomValidator,
  roomIdValidator,
  roomParamValidator,
} from "../validators/roomValidator.js";
import { body } from "express-validator";

const router = express.Router();

router.post("/", protect, createRoomValidator, validateRequest, createRoom);
router.get("/", protect, getAllRoom);
router.get("/:id", protect, roomParamValidator, validateRequest, getRoomById);
router.patch("/:id", protect, updateRoomValidator, validateRequest, updateRoom);
router.delete("/:id", protect, roomParamValidator, validateRequest, deleteRoom);
router.post(
  "/:roomId/join",
  protect,
  roomIdValidator,
  validateRequest,
  joinRoom,
);
router.post(
  "/:roomId/leave",
  protect,
  roomIdValidator,
  validateRequest,
  leaveRoom,
);
router.get(
  "/:roomId/members",
  protect,
  roomIdValidator,
  validateRequest,
  getRoomMembers,
);
router.post(
  "/:roomId/members",
  protect,
  roomIdValidator,
  body("email").isEmail().withMessage("A valid email is required"),
  validateRequest,
  addRoomMember,
);
router.post("/:roomId/admins", protect, makeRoomAdmin);
router.delete(
  "/:roomId/admins/:userId",
  protect,
  roomIdValidator,
  validateRequest,
  removeRoomAdmin,
);
router.delete(
  "/:roomId/members/:userId",
  protect,
  roomIdValidator,
  validateRequest,
  removeRoomMember,
);

export default router;
