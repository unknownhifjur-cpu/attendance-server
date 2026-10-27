import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "app", unique: true },
    company:   { type: String, default: "My Company" },
    logo:      { type: String, default: "" }, // data URL or path
    currency:  { type: String, default: "₹" },
    workingDays:    { type: Number, default: 26, min: 1, max: 31 },
    lateDeduction:  { type: Number, default: 0.25, min: 0, max: 1 },
    shiftStart:     { type: String, default: "09:15" },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);