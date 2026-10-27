import { Router } from "express";
import { uploadMiddleware, uploadImage } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const r = Router();

// Upload image (requires authenticated user)
r.post("/", requireAuth, uploadMiddleware.single("image"), uploadImage);

export default r;

