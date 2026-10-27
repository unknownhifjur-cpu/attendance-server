import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env.js";

// Fix for Node.js on Windows with MongoDB Atlas SRV record resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS cannot be set
}

let isConnected = false;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      dbName: "attendance_payroll",
      serverSelectionTimeoutMS: 7000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error event:", err);
});
