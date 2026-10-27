import { z } from "zod";
import { Settings } from "../models/Settings.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateSettingsSchema = z.object({
  company: z.string().trim().min(1).optional(),
  logo: z.string().optional(),
  currency: z.string().trim().min(1).max(5).optional(),
  workingDays: z.number().min(1).max(31).optional(),
  lateDeduction: z.number().min(0).max(1).optional(),
  shiftStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm required").optional(),
});

export const getSettings = asyncHandler(async (_req, res) => {
  let settings = await Settings.findOne({ singleton: "app" });
  if (!settings) {
    settings = await Settings.create({
      singleton: "app",
      company: "Attendance & Payroll System",
      currency: "₹",
      workingDays: 26,
      lateDeduction: 0.25,
      shiftStart: "09:15",
    });
  }
  res.status(200).json(new ApiResponse(200, settings));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = updateSettingsSchema.parse(req.body);
  const settings = await Settings.findOneAndUpdate(
    { singleton: "app" },
    { $set: data },
    { new: true, upsert: true }
  );
  res.status(200).json(new ApiResponse(200, settings, "Settings updated successfully"));
});

