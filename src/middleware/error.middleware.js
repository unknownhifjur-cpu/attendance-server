import { ZodError } from "zod";

export function notFound(req, _res, next) {
  next({
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    isOperational: true,
  });
}

export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  if (err instanceof ZodError) {
    status = 400;
    message = "Validation error";
    details = err.flatten().fieldErrors;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = "Database validation failed";
    details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([key, val]) => [key, val.message])
    );
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}. It must be unique.`;
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ID format for ${err.path}`;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  } else if (!err.isOperational && status === 500) {
    message = "Internal server error";
  }

  if (status >= 500) {
    console.error("Unhandled Server Error:", err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
