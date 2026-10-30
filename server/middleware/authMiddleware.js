import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import userModel from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const user = await userModel.findById(decoded.userId).select("-password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User no longer exists",
    });
  }

  req.user = user;
  next();
});

export { protect };
