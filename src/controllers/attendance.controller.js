import { z } from "zod";
import { Attendance } from "../models/Attendance.js";
import { Settings } from "../models/Settings.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const markAttendanceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  status: z.enum(["present", "late", "half-day", "absent", "leave"]),
  clockIn: z.string().nullable().optional(),
  clockOut: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export const clockIn = asyncHandler(async (req, res) => {
  const today = getLocalDateString();
  const userId = req.user._id;

  let existing = await Attendance.findOne({ user: userId, date: today });
  if (existing && existing.clockIn) {
    throw ApiError.badRequest("You have already clocked in today");
  }

  const now = new Date();
  const settings = (await Settings.findOne({ singleton: "app" })) || { shiftStart: "09:15" };
  const [shiftH, shiftM] = (settings.shiftStart || "09:15").split(":").map(Number);
  
  const shiftTime = new Date(now);
  shiftTime.setHours(shiftH, shiftM, 0, 0);

  let status = "present";
  let lateMinutes = 0;

  if (now > shiftTime) {
    lateMinutes = Math.floor((now.getTime() - shiftTime.getTime()) / (1000 * 60));
    status = lateMinutes > 5 ? "late" : "present";
  }

  const record = await Attendance.findOneAndUpdate(
    { user: userId, date: today },
    {
      $set: {
        clockIn: now,
        status,
        lateMinutes,
      },
    },
    { new: true, upsert: true }
  ).populate("user", "name username dept");

  res.status(200).json(new ApiResponse(200, record, `Clocked in successfully (${status})`));
});

export const clockOut = asyncHandler(async (req, res) => {
  const today = getLocalDateString();
  const userId = req.user._id;

  const record = await Attendance.findOne({ user: userId, date: today });
  if (!record || !record.clockIn) {
    throw ApiError.badRequest("You must clock in before clocking out");
  }
  if (record.clockOut) {
    throw ApiError.badRequest("You have already clocked out today");
  }

  const now = new Date();
  const diffMs = now.getTime() - new Date(record.clockIn).getTime();
  const workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

  record.clockOut = now;
  record.workHours = workHours;

  if (workHours < 4 && record.status === "present") {
    record.status = "half-day";
  }

  await record.save();
  await record.populate("user", "name username dept");

  res.status(200).json(new ApiResponse(200, record, `Clocked out successfully. Total: ${workHours} hrs`));
});

export const getTodayStatus = asyncHandler(async (req, res) => {
  const today = getLocalDateString();
  const record = await Attendance.findOne({ user: req.user._id, date: today });
  res.status(200).json(new ApiResponse(200, record));
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { user: req.user._id };

  if (month && year) {
    const m = String(month).padStart(2, "0");
    filter.date = { $regex: `^${year}-${m}` };
  } else if (year) {
    filter.date = { $regex: `^${year}-` };
  }

  const records = await Attendance.find(filter).sort({ date: -1 });
  res.status(200).json(new ApiResponse(200, records));
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const { date, month, year, userId, status } = req.query;
  const filter = {};

  if (userId) filter.user = userId;
  if (status) filter.status = status;

  if (date) {
    filter.date = date;
  } else if (month && year) {
    const m = String(month).padStart(2, "0");
    filter.date = { $regex: `^${year}-${m}` };
  } else if (year) {
    filter.date = { $regex: `^${year}-` };
  }

  const records = await Attendance.find(filter)
    .populate("user", "name username dept role")
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json(new ApiResponse(200, records));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const data = markAttendanceSchema.parse(req.body);

  const user = await User.findById(data.userId);
  if (!user) throw ApiError.notFound("User not found");

  let workHours = 0;
  if (data.clockIn && data.clockOut) {
    const diff = new Date(data.clockOut).getTime() - new Date(data.clockIn).getTime();
    if (diff > 0) {
      workHours = Number((diff / (1000 * 60 * 60)).toFixed(2));
    }
  }

  const record = await Attendance.findOneAndUpdate(
    { user: data.userId, date: data.date },
    {
      $set: {
        status: data.status,
        clockIn: data.clockIn ? new Date(data.clockIn) : null,
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        notes: data.notes || "",
        workHours,
      },
    },
    { new: true, upsert: true }
  ).populate("user", "name username dept role");

  res.status(200).json(new ApiResponse(200, record, "Attendance record saved"));
});

export const getAttendanceStats = asyncHandler(async (req, res) => {
  const today = getLocalDateString();
  const totalEmployees = await User.countDocuments({ active: true, role: "staff" });
  
  const todayRecords = await Attendance.find({ date: today }).populate("user", "name username dept");
  
  const present = todayRecords.filter((r) => r.status === "present").length;
  const late = todayRecords.filter((r) => r.status === "late").length;
  const halfDay = todayRecords.filter((r) => r.status === "half-day").length;
  const leave = todayRecords.filter((r) => r.status === "leave").length;
  const absent = Math.max(0, totalEmployees - (present + late + halfDay + leave));

  res.status(200).json(
    new ApiResponse(200, {
      date: today,
      totalEmployees,
      present,
      late,
      halfDay,
      leave,
      absent,
      records: todayRecords,
    })
  );
});

