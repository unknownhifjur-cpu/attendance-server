import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const r = Router();

r.get("/", getSettings);
r.patch("/", requireAuth, requireRole("admin"), updateSettings);

export default r;

