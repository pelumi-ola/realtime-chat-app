import crypto from "node:crypto";
import userModel from "../models/User.js";
import supabase from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function uploadAvatar(req, res, next) {
  let bucket;
  let filePath;

  try {
    if (!req.file) {
      return errorResponse(res, 400, "Please select an image to upload");
    }

    const extensionByType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensionByType[req.file.mimetype];

    if (!extension) {
      return errorResponse(
        res,
        400,
        "Only JPEG, PNG, and WebP images are allowed",
      );
    }

    bucket = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
    filePath = `${req.user._id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    console.log("avatar:", { bucket, filePath, url: data.publicUrl });

    const user = await userModel
      .findByIdAndUpdate(
        req.user._id,
        { $set: { avatarUrl: data.publicUrl } },
        { new: true, runValidators: true },
      )
      .select("-password");

    if (!user) {
      await supabase.storage.from(bucket).remove([filePath]);

      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "Avatar uploaded successfully", { user });
  } catch (error) {
    if (bucket && filePath) {
      try {
        await supabase.storage.from(bucket).remove([filePath]);
      } catch (cleanupError) {
        console.error("Avatar cleanup failed:", cleanupError);
      }
    }

    next(error);
  }
}
