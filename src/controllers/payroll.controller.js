import { z } from "zod";
import { Payroll } from "../models/Payroll.js";
import { Attendance } from "../models/Attendance.js";
import { User } from "../models/User.js";
import { Settings } from "../models/Settings.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const generatePayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  userId: z.string().optional(),
});

export const updatePayrollSchema = z.object({
  allowances: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  status: z.enum(["draft", "generated", "paid"]).optional(),
  paymentDate: z.string().nullable().optional(),
  paymentMethod: z.enum(["bank_transfer", "cash", "cheque", "upi"]).optional(),
  remarks: z.string().optional(),
});

async function calculateUserPayroll(user, month, year, settings) {
  const m = String(month).padStart(2, "0");
  const monthRegex = `^${year}-${m}`;

  const records = await Attendance.find({
    user: user._id,
    date: { $regex: monthRegex },
  });

  const workingDays = settings.workingDays || 26;
  const basicSalary = user.salary || 0;
  const dailyRate = workingDays > 0 ? Number((basicSalary / workingDays).toFixed(2)) : 0;

  let presentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let leaveDays = 0;
  let absentDays = 0;

  for (const r of records) {
    if (r.status === "present") presentDays++;
    else if (r.status === "late") lateDays++;
    else if (r.status === "half-day") halfDays++;
    else if (r.status === "leave") leaveDays++;
    else if (r.status === "absent") absentDays++;
  }

  // Deductions
  const latePenaltyFraction = settings.lateDeduction ?? 0.25;
  const lateDeductions = Number((lateDays * dailyRate * latePenaltyFraction).toFixed(2));
  const halfDayDeductions = Number((halfDays * dailyRate * 0.5).toFixed(2));
  const absentDeductions = Number((absentDays * dailyRate).toFixed(2));
  const totalDeductions = Number((lateDeductions + halfDayDeductions + absentDeductions).toFixed(2));

  const grossSalary = basicSalary;
  const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions));

  return {
    user: user._id,
    month,
    year,
    basicSalary,
    workingDays,
    presentDays,
    lateDays,
    halfDays,
    absentDays,
    leaveDays,
    dailyRate,
    lateDeductions,
    absentDeductions: Number((absentDeductions + halfDayDeductions).toFixed(2)),
    allowances: 0,
    bonus: 0,
    grossSalary,
    totalDeductions,
    netSalary,
    status: "generated",
  };
}

export const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year, userId } = generatePayrollSchema.parse(req.body);

  const settings = (await Settings.findOne({ singleton: "app" })) || {
    workingDays: 26,
    lateDeduction: 0.25,
  };

  let targetUsers = [];
  if (userId) {
    const u = await User.findById(userId);
    if (!u) throw ApiError.notFound("User not found");
    targetUsers = [u];
  } else {
    targetUsers = await User.find({ active: true, role: "staff" });
  }

  const results = [];
  for (const user of targetUsers) {
    const payrollData = await calculateUserPayroll(user, month, year, settings);

    // Keep existing allowances/bonus if already generated before
    const existing = await Payroll.findOne({ user: user._id, month, year });
    if (existing) {
      payrollData.allowances = existing.allowances;
      payrollData.bonus = existing.bonus;
      payrollData.status = existing.status;
      payrollData.paymentDate = existing.paymentDate;
      payrollData.paymentMethod = existing.paymentMethod;
      payrollData.grossSalary = payrollData.basicSalary + payrollData.allowances + payrollData.bonus;
      payrollData.netSalary = Math.max(0, Math.round(payrollData.grossSalary - payrollData.totalDeductions));
    }

    const saved = await Payroll.findOneAndUpdate(
      { user: user._id, month, year },
      { $set: payrollData },
      { new: true, upsert: true }
    ).populate("user", "name username dept salary");

    results.push(saved);
  }

  res.status(200).json(
    new ApiResponse(200, results, `Generated payroll for ${results.length} employee(s)`)
  );
});

export const getAllPayrolls = asyncHandler(async (req, res) => {
  const { month, year, userId, status } = req.query;
  const filter = {};

  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (userId) filter.user = userId;
  if (status) filter.status = status;

  const payrolls = await Payroll.find(filter)
    .populate("user", "name username dept salary")
    .sort({ year: -1, month: -1, createdAt: -1 });

  res.status(200).json(new ApiResponse(200, payrolls));
});

export const getMyPayrolls = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const filter = { user: req.user._id };
  if (year) filter.year = Number(year);

  const payrolls = await Payroll.find(filter)
    .populate("user", "name username dept")
    .sort({ year: -1, month: -1 });

  res.status(200).json(new ApiResponse(200, payrolls));
});

export const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate("user", "name username dept salary");
  if (!payroll) throw ApiError.notFound("Payroll not found");

  if (req.user.role !== "admin" && payroll.user._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Access denied");
  }

  res.status(200).json(new ApiResponse(200, payroll));
});

export const updatePayroll = asyncHandler(async (req, res) => {
  const data = updatePayrollSchema.parse(req.body);
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw ApiError.notFound("Payroll not found");

  if (data.allowances !== undefined) payroll.allowances = data.allowances;
  if (data.bonus !== undefined) payroll.bonus = data.bonus;
  if (data.status !== undefined) {
    payroll.status = data.status;
    if (data.status === "paid" && !payroll.paymentDate) {
      payroll.paymentDate = new Date();
    }
  }
  if (data.paymentDate !== undefined) {
    payroll.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;
  }
  if (data.paymentMethod !== undefined) payroll.paymentMethod = data.paymentMethod;
  if (data.remarks !== undefined) payroll.remarks = data.remarks;

  // Recalculate gross and net
  payroll.grossSalary = payroll.basicSalary + (payroll.allowances || 0) + (payroll.bonus || 0);
  payroll.netSalary = Math.max(0, Math.round(payroll.grossSalary - payroll.totalDeductions));

  await payroll.save();
  await payroll.populate("user", "name username dept salary");

  res.status(200).json(new ApiResponse(200, payroll, "Payroll updated successfully"));
});

export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw ApiError.notFound("Payroll not found");

  await Payroll.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Payroll deleted successfully"));
});

export const getPayrollStats = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = {};
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  const payrolls = await Payroll.find(filter);

  const totalPayroll = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
  const totalPaid = payrolls
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + (p.netSalary || 0), 0);
  const totalPending = totalPayroll - totalPaid;
  const count = payrolls.length;

  res.status(200).json(
    new ApiResponse(200, {
      totalPayroll,
      totalPaid,
      totalPending,
      count,
    })
  );
});

