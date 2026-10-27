import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    workingDays: {
      type: Number,
      default: 26,
      min: 1,
    },
    presentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    absentDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "generated", "paid"],
      default: "generated",
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "cheque", "upi"],
      default: "bank_transfer",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model("Payroll", payrollSchema);

