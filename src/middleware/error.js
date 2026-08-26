import mongoose from "mongoose";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode ?? error.status ?? 500;
  let message = error.message ?? "Internal server error";

  if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(error.errors).map((item) => item.message).join(", ");
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${error.path}`;
  } else if (error?.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "value";
    message = `${field} already exists`;
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ message, ...(process.env.NODE_ENV === "development" && { stack: error.stack }) });
}
