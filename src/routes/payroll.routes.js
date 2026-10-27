import { Router } from "express";
import {
  generatePayroll,
  getAllPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollStats,
} from "../controllers/payroll.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const r = Router();

// Staff and Admin routes
r.get("/my", requireAuth, getMyPayrolls);
r.get("/stats", requireAuth, requireRole("admin"), getPayrollStats);
r.get("/:id", requireAuth, getPayrollById);

// Admin-only routes
r.get("/", requireAuth, requireRole("admin"), getAllPayrolls);
r.post("/generate", requireAuth, requireRole("admin"), generatePayroll);
r.patch("/:id", requireAuth, requireRole("admin"), updatePayroll);
r.delete("/:id", requireAuth, requireRole("admin"), deletePayroll);

export default r;

