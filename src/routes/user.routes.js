import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const r = Router();

// Profile update for any authenticated user
r.patch("/profile", requireAuth, updateProfile);

// Admin-only user management
r.get("/", requireAuth, requireRole("admin"), getUsers);
r.get("/:id", requireAuth, requireRole("admin"), getUserById);
r.post("/", requireAuth, requireRole("admin"), createUser);
r.patch("/:id", requireAuth, requireRole("admin"), updateUser);
r.delete("/:id", requireAuth, requireRole("admin"), deleteUser);

export default r;

