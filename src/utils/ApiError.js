export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
  static badRequest(msg, d)   { return new ApiError(400, msg, d); }
  static unauthorized(msg)    { return new ApiError(401, msg || "Unauthorized"); }
  static forbidden(msg)       { return new ApiError(403, msg || "Forbidden"); }
  static notFound(msg)        { return new ApiError(404, msg || "Not found"); }
  static conflict(msg)        { return new ApiError(409, msg); }
}