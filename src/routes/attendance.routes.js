import { Router } from "express";
import {
  clockIn,
  clockOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  markAttendance,
  getAttendanceStats,
} from "../controllers/attendance.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const r = Router();

// Staff and Admin routes
r.post("/clock-in", requireAuth, clockIn);
r.post("/clock-out", requireAuth, clockOut);
r.get("/today", requireAuth, getTodayStatus);
r.get("/my", requireAuth, getMyAttendance);

// Admin-only routes
r.get("/all", requireAuth, requireRole("admin"), getAllAttendance);
r.get("/stats", requireAuth, requireRole("admin"), getAttendanceStats);
r.post("/mark", requireAuth, requireRole("admin"), markAttendance);

export default r;

