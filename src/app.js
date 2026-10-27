import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.nodeEnv !== "production") {
          return callback(null, true);
        }
        if (origin === env.clientUrl) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (env.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, uptime: process.uptime(), env: env.nodeEnv })
  );

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
