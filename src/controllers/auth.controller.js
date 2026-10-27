import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const sign = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ username: username.toLowerCase() }).select("+password");
  if (!user || !user.active) {
    throw ApiError.unauthorized("Wrong username or password");
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw ApiError.unauthorized("Wrong username or password");
  }

  const token = sign(user);
  res.cookie("token", token, cookieOpts);
  res.status(200).json(new ApiResponse(200, { user: user.toJSON(), token }, "Signed in"));
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
  });
  res.status(200).json(new ApiResponse(200, null, "Signed out"));
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user));
});
