import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  username: z.string().trim().min(3, "Username must be at least 3 characters").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "staff"]).default("staff"),
  dept: z.string().trim().default("General"),
  salary: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  username: z.string().trim().min(3).toLowerCase().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "staff"]).optional(),
  dept: z.string().trim().optional(),
  salary: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
});

export const getUsers = asyncHandler(async (req, res) => {
  const { search, role, dept, active } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }
  if (role) filter.role = role;
  if (dept) filter.dept = dept;
  if (active !== undefined && active !== "") {
    filter.active = active === "true";
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, users));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  res.status(200).json(new ApiResponse(200, user));
});

export const createUser = asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);

  const existing = await User.findOne({ username: data.username });
  if (existing) {
    throw ApiError.conflict(`Username "${data.username}" is already taken`);
  }

  const user = await User.create(data);
  res.status(201).json(new ApiResponse(201, user.toJSON(), "User created successfully"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = updateUserSchema.parse(req.body);
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (data.username && data.username !== user.username) {
    const existing = await User.findOne({ username: data.username });
    if (existing) throw ApiError.conflict(`Username "${data.username}" is already taken`);
    user.username = data.username;
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.role !== undefined) user.role = data.role;
  if (data.dept !== undefined) user.dept = data.dept;
  if (data.salary !== undefined) user.salary = data.salary;
  if (data.active !== undefined) user.active = data.active;
  if (data.password) {
    user.password = data.password;
  }

  await user.save();
  res.status(200).json(new ApiResponse(200, user.toJSON(), "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (user._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await User.findById(req.user._id).select("+password");

  if (data.name) {
    user.name = data.name;
  }

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw ApiError.badRequest("Current password is required to change password");
    }
    const match = await user.comparePassword(data.currentPassword);
    if (!match) {
      throw ApiError.badRequest("Current password does not match");
    }
    user.password = data.newPassword;
  }

  await user.save();
  res.status(200).json(new ApiResponse(200, user.toJSON(), "Profile updated successfully"));
});

