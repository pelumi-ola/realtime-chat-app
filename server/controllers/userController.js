import userModel from "../models/User.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function getUserById(req, res, next) {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("firstName lastName userName avatarUrl isOnline");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User retrieved successfully", {
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const allowedFields = ["firstName", "lastName", "userName"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(
        res,
        400,
        "Provide at least one profile field to update",
      );
    }

    const user = await userModel
      .findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true },
      )
      .select("-password");

    return successResponse(res, 200, "Profile updated successfully", {
      data: { user },
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, "That username is already taken");
    }

    next(error);
  }
}
