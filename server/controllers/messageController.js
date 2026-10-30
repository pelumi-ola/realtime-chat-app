import mongoose from "mongoose";
import roomModel from "../models/Room.js";
import messageModel from "../models/Message.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function getRoomMessages(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!mongoose.isValidObjectId(roomId)) {
      return errorResponse(res, 400, "Invalid room ID");
    }

    const room = await roomModel.findById(roomId);

    if (!room) {
      return errorResponse(res, 404, "Room not found");
    }

    const isMember = room.members.some((member) => member.equals(req.user._id));

    if (!isMember) {
      return errorResponse(res, 403, "You are not a member of this romm");
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 30),
    );
    const skip = (page - 1) * limit;

    const messages = await messageModel
      .find({ room: roomId })
      .populate("sender", "firstName lastName userName avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalMessages = await messageModel.countDocuments({ room: roomId });

    return successResponse(res, 200, "Messages retrived successfully", {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;

    if (!mongoose.isValidObjectId(messageId)) {
      return errorResponse(res, 400, "Invalid message ID");
    }

    const message = await messageModel.findById(messageId);

    if (!message) {
      return errorResponse(res, 404, "Message not found");
    }

    if (!message.sender.equals(req.user._id)) {
      return errorResponse(res, 403, "You can only delete your own messages");
    }

    await message.deleteOne();

    return successResponse(res, 200, "Message deleted successfully", {
      data: { messageId },
    });
  } catch (error) {
    next(error);
  }
}
