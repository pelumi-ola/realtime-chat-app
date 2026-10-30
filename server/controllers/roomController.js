import roomModel from "../models/Room.js";
import { successResponse, errorResponse } from "../utils/response.js";
import userModel from "../models/User.js";
import messageModel from "../models/Message.js";

const canManage = (room, user) =>
  user.role === "admin" ||
  room.createdBy?.equals(user._id) ||
  room.admins?.some((a) => a.equals(user._id));

const isOwner = (room, user) =>
  user.role === "admin" || room.createdBy?.equals(user._id);

const notifyRooms = (req, roomId, action) =>
  req.app.get("io")?.emit("rooms_changed", { roomId: String(roomId), action });

// Pull every socket of this user out of the socket.io room
const kickFromSocketRoom = (req, roomId, userId) =>
  req.app.get("io")?.in(`user:${userId}`).socketsLeave(String(roomId));

export async function createRoom(req, res, next) {
  try {
    const { groupName, description } = req.body;
    if (!groupName) {
      return errorResponse(res, 400, "Room name is required");
    }

    const existingRoom = await roomModel
      .findOne({
        groupName: groupName.trim(),
      })
      .collation({ locale: "en", strength: 2 });

    if (existingRoom) {
      return errorResponse(res, 409, "groupName already exist");
    }

    const room = await roomModel.create({
      groupName: groupName.trim(),
      description,
      createdBy: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
    });

    notifyRooms(req, room._id, "created");

    return successResponse(res, 200, "Room created successfully", { room });
  } catch (error) {
    next(error);
  }
}

export async function getAllRoom(req, res, next) {
  try {
    const rooms = await roomModel.find();

    if (rooms === "") {
      return errorResponse(res, 404, "Room is empty");
    }
    return successResponse(res, 200, "All rooms retrieved succsessful", {
      rooms,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomById(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.id);

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }
    return successResponse(res, 200, "All rooms retrieved succsessful", {
      room,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const { groupName, description, members, updatedBy } = req.body;
    const room = await roomModel.findById(req.params.id);

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }

    if (!canManage(room, req.user)) {
      return errorResponse(res, 403, "Only a room admin can do this");
    }

    const updatedRoom = await roomModel.findByIdAndUpdate(
      req.params.id,
      {
        groupName,
        description,
        updatedBy: req.user._id,
      },
      { new: true },
    );

    notifyRooms(req, updatedRoom._id, "updated");

    return successResponse(res, 200, "Rooms updated succsessful", {
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.id);

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }

    if (!canManage(room, req.user)) {
      return errorResponse(res, 403, "Only a room admin can do this");
    }

    await room.deleteOne();
    messageModel.deleteMany({ room: room._id });

    req.app.get("io")?.in(String(room._id)).socketsLeave(String(room._id));
    notifyRooms(req, room._id, "deleted");

    return successResponse(res, 200, "Room deleted successfully");
  } catch (error) {
    next(error);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.roomId);

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }

    const userId = req.user._id;

    if (room.members.some((member) => member.equals(userId))) {
      return res.status(400).json({ message: "Already a member" });
    }
    room.members.addToSet(userId);
    await room.save();

    notifyRooms(req, room._id, "joined");

    return successResponse(res, 200, "Joined room successfully", { room });
  } catch (error) {
    next(error);
  }
}

export async function leaveRoom(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.roomId);

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }

    const isMember = room.members.some((member) => member.equals(req.user._id));

    if (!isMember) {
      return errorResponse(res, 403, "You are not a member of this room");
    }

    room.members.pull(req.user._id);
    await room.save();

    kickFromSocketRoom(req, room._id, req.user._id);
    notifyRooms(req, room._id, "left");

    return successResponse(res, 200, "Left room successfully", { room });
  } catch (error) {
    next(error);
  }
}

export async function getRoomMembers(req, res, next) {
  try {
    const room = await roomModel
      .findById(req.params.roomId)
      .populate("members", "-password");

    if (!room) {
      return errorResponse(res, 404, "Room Not found");
    }

    return successResponse(res, 200, "Room members retrieved successfully", {
      members: room.members,
    });
  } catch (error) {
    next(error);
  }
}

export async function addRoomMember(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.roomId);
    if (!room) return errorResponse(res, 404, "Room Not found");

    if (!canManage(room, req.user)) {
      return errorResponse(res, 403, "Only a room admin can do this");
    }

    const email = req.body.email?.trim().toLowerCase();
    const user = await userModel.findOne({ email });
    if (!user) return errorResponse(res, 404, "No user found with that email");

    if (room.members.some((m) => m.equals(user._id))) {
      return errorResponse(res, 400, "Already a member");
    }

    room.members.addToSet(user._id);
    await room.save();
    notifyRooms(req, room._id, "member_added");
    return successResponse(res, 200, "Member added successfully", { room });
  } catch (error) {
    next(error);
  }
}

export async function makeRoomAdmin(req, res, next) {
  try {
    const room = await roomModel.findById(req.params.roomId);
    if (!room) return errorResponse(res, 404, "Room Not found");
    if (!canManage(room, req.user))
      return errorResponse(res, 403, "Only a room admin can do this");

    const { userId } = req.body;
    if (!room.members.some((m) => m.equals(userId)))
      return errorResponse(res, 400, "User is not a member of this room");

    room.admins.addToSet(userId);
    await room.save();
    notifyRooms(req, room._id, "admin_added");
    return successResponse(res, 200, "Member promoted to room admin", { room });
  } catch (error) {
    next(error);
  }
}

export async function removeRoomAdmin(req, res, next) {
  try {
    const { roomId, userId } = req.params;
    const room = await roomModel.findById(roomId);
    if (!room) return errorResponse(res, 404, "Room Not found");

    if (!isOwner(room, req.user))
      return errorResponse(
        res,
        403,
        "Only the room creator can remove an admin",
      );

    if (room.createdBy?.equals(userId))
      return errorResponse(res, 400, "The creator can't be removed as admin");

    if (!room.admins.some((a) => a.equals(userId)))
      return errorResponse(res, 400, "User is not a room admin");

    room.admins.pull(userId);
    await room.save();
    notifyRooms(req, room._id, "admin_removed");
    return successResponse(res, 200, "Admin role removed", { room });
  } catch (error) {
    next(error);
  }
}

export async function removeRoomMember(req, res, next) {
  try {
    const { roomId, userId } = req.params;
    const room = await roomModel.findById(roomId);
    if (!room) return errorResponse(res, 404, "Room Not found");

    if (!canManage(room, req.user))
      return errorResponse(res, 403, "Only a room admin can do this");

    if (room.createdBy?.equals(userId))
      return errorResponse(
        res,
        400,
        "The creator can't be removed from the room",
      );

    if (!room.members.some((m) => m.equals(userId)))
      return errorResponse(res, 404, "User is not a member of this room");

    const targetIsAdmin = room.admins.some((a) => a.equals(userId));
    if (targetIsAdmin && !isOwner(room, req.user))
      return errorResponse(res, 403, "Only the creator can remove an admin");

    room.members.pull(userId);
    room.admins.pull(userId); // a removed member shouldn't keep admin rights
    await room.save();
    kickFromSocketRoom(req, room._id, userId);
    notifyRooms(req, room._id, "member_removed");
    return successResponse(res, 200, "Member removed successfully", { room });
  } catch (error) {
    next(error);
  }
}
