import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../models/User.js";
import roomModel from "../models/Room.js";
import messageModel from "../models/Message.js";

export function registerChatSocket(io) {
  // Authenticate every socket connection using its JWT.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // Track socket IDs per user, supporting multiple tabs/devices.
  const connections = new Map();

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    let userSockets = connections.get(userId);

    if (!userSockets) {
      userSockets = new Set();
      connections.set(userId, userSockets);
    }

    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);

    // Join a room only if the user is a database member.
    socket.on("join_room", async (payload, acknowledge) => {
      const ack = typeof acknowledge === "function" ? acknowledge : () => {};

      try {
        const { roomId } = payload || {};

        if (!mongoose.isValidObjectId(roomId)) {
          return ack({ success: false, message: "Invalid room ID" });
        }

        const room = await roomModel.findById(roomId);

        if (!room) {
          return ack({ success: false, message: "Room not found" });
        }

        const isMember = room.members.some((member) => member.equals(userId));

        if (!isMember) {
          return ack({
            success: false,
            message: "You are not a member of this room",
          });
        }

        await socket.join(roomId);

        socket.to(roomId).emit("user_joined", {
          userId,
          roomId,
        });

        ack({ success: true, roomId });
      } catch {
        ack({ success: false, message: "Unable to join room" });
      }
    });

    // Leave the socket room without changing DB membership.
    socket.on("leave_room", async (payload, acknowledge) => {
      const ack = typeof acknowledge === "function" ? acknowledge : () => {};

      const { roomId } = payload || {};

      if (!mongoose.isValidObjectId(roomId)) {
        return ack({ success: false, message: "Invalid room ID" });
      }

      await socket.leave(roomId);

      socket.to(roomId).emit("user_left", {
        userId,
        roomId,
      });

      ack({ success: true, roomId });
    });

    // Persist first, then broadcast the saved message.
    socket.on("send_message", async (payload, acknowledge) => {
      const ack = typeof acknowledge === "function" ? acknowledge : () => {};

      try {
        const { roomId, content } = payload || {};

        if (!mongoose.isValidObjectId(roomId)) {
          return ack({ success: false, message: "Invalid room ID" });
        }

        if (
          typeof content !== "string" ||
          !content.trim() ||
          content.trim().length > 5000
        ) {
          return ack({
            success: false,
            message: "Message must contain 1 to 5000 characters",
          });
        }

        // Require the socket to have joined this room as well.
        if (!socket.rooms.has(roomId)) {
          return ack({
            success: false,
            message: "Join the room before sending messages",
          });
        }

        const room = await roomModel.findById(roomId);

        if (!room) {
          return ack({ success: false, message: "Room not found" });
        }

        const isMember = room.members.some((member) => member.equals(userId));

        if (!isMember) {
          await socket.leave(roomId);

          return ack({
            success: false,
            message: "You are not a member of this room",
          });
        }

        const savedMessage = await messageModel.create({
          room: roomId,
          sender: userId,
          content: content.trim(),
        });

        const message = await messageModel
          .findById(savedMessage._id)
          .populate("sender", "firstName lastName userName avatarUrl")
          .lean();

        io.to(roomId).emit("receive_message", message);

        ack({ success: true, message });
      } catch {
        ack({ success: false, message: "Unable to send message" });
      }
    });

    socket.on("disconnect", async () => {
      const activeSockets = connections.get(userId);

      if (!activeSockets) return;

      activeSockets.delete(socket.id);

      if (activeSockets.size === 0) {
        connections.delete(userId);

        await userModel.findByIdAndUpdate(userId, {
          $set: { isOnline: false },
        });

        io.emit("user_offline", { userId });
      }
    });

    if (wasOffline) {
      await userModel.findByIdAndUpdate(userId, {
        $set: { isOnline: true },
      });

      io.emit("user_online", { userId });
    }
  });
}
