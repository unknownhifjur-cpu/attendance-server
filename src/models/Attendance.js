import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    clockIn: {
      type: Date,
      default: null,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["present", "late", "half-day", "absent", "leave"],
      default: "present",
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    workHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: one attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);

