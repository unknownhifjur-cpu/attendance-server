import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) throw ApiError.unauthorized("Not signed in");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw ApiError.unauthorized("Account unavailable");

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return next(ApiError.forbidden("Insufficient role"));
  next();
};