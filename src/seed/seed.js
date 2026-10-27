import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Settings } from "../models/Settings.js";
import mongoose from "mongoose";

async function run() {
  await connectDB();

  await Settings.updateOne(
    { singleton: "app" },
    { $setOnInsert: { singleton: "app", company: "My Company" } },
    { upsert: true }
  );

  const users = [
    { name: "Admin",        username: "admin",  password: "admin123", role: "admin", dept: "Management", salary: 0 },
    { name: "Amina Rahman", username: "amina",  password: "staff123", role: "staff", dept: "Accounts",        salary: 30000 },
    { name: "Rahul Das",    username: "rahul",  password: "staff123", role: "staff", dept: "Operations",      salary: 26000 },
    { name: "Sofia Khan",   username: "sofia",  password: "staff123", role: "staff", dept: "Human Resources", salary: 28000 },
    { name: "Daniel Roy",   username: "daniel", password: "staff123", role: "staff", dept: "IT Support",      salary: 35000 },
  ];

  for (const u of users) {
    if (!(await User.findOne({ username: u.username }))) {
      await User.create(u);
      console.log("created", u.username);
    }
  }

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });