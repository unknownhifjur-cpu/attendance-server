import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import payrollRoutes from "./payroll.routes.js";
import settingsRoutes from "./settings.routes.js";
import uploadRoutes from "./upload.routes.js";

const r = Router();

r.use("/auth", authRoutes);
r.use("/users", userRoutes);
r.use("/attendance", attendanceRoutes);
r.use("/payroll", payrollRoutes);
r.use("/settings", settingsRoutes);
r.use("/upload", uploadRoutes);

export default r;
