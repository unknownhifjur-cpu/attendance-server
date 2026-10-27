import multer from "multer";
import { uploadBuffer } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only image files are allowed"));
    }
  },
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No image file provided");
  }

  const folder = req.query.folder || "attendance-payroll";
  const result = await uploadBuffer(req.file.buffer, { folder });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
      "Image uploaded to Cloudinary successfully"
    )
  );
});

