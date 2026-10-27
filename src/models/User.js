import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role:     { type: String, enum: ["admin", "staff"], default: "staff" },
    dept:     { type: String, default: "General", trim: true },
    salary:   { type: Number, default: 0, min: 0 },
    avatar:   { type: String, default: "" },
    active:   { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model("User", userSchema);
