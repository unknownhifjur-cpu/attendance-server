import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, loginSchema } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const r = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

r.post("/login", loginLimiter, validate(loginSchema), login);
r.post("/logout", logout);
r.get("/me", requireAuth, me);

export default r;
