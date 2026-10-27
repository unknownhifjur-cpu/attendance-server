import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in server folder or current working directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "dkla9i94n",
    apiKey: process.env.CLOUDINARY_API_KEY || "835139336496862",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "2tIbQmOak0sGEQ2pr-KazOWArcM",
  },
};

if (!env.mongoUri) throw new Error("MONGO_URI missing in .env");
if (!env.jwtSecret) throw new Error("JWT_SECRET missing in .env");
