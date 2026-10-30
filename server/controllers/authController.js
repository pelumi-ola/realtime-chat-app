import userModel from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function registerUser(req, res, next) {
  try {
    const { firstName, lastName, userName, email, password, avatarUrl } =
      req.body;
    if (!firstName || !lastName || !userName || !email || !password) {
      return errorResponse(res, 400, "Please fill in all required fields");
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      firstName,
      lastName,
      userName,
      email: normalizedEmail,
      password: hashedPassword,
      avatarUrl,
    });
    await newUser.save();

    const token = generateToken(newUser._id);
    return successResponse(res, 200, "User registered successfully", {
      authToken: token,
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userName: newUser.userName,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 401, "Please fill in all required fields");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 400, "Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 400, "Invalid credentials");
    }
    const token = generateToken(user._id);

    return successResponse(res, 200, "success", {
      authToken: token,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    if (!user) {
      console.error("ERROR:", error);

      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "success", { user });
  } catch (error) {
    next(error);
  }
}

export async function logUserOut(req, res, next) {
  try {
    return successResponse(res, 200, "Logged out sucessfully");
  } catch (error) {
    next(error);
  }
  return errorResponse(res, 500, "internal server error");
}
