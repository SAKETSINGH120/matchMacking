const APIError = require("../utils/APIError");
const config = require("../../config/config");

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error for debugging (with full details)
  if (config.NODE_ENV === "development") {
    console.error("🚨 Error Details:");
    console.error("Message:", err.message);
    console.error("Status:", error.statusCode || 500);
    console.error("Stack:", err.stack);
    console.error("─".repeat(60));
  } else {
    console.error(`Error [${error.statusCode}]: ${err.message}`);
  }

  // Handle different types of errors

  // Mongoose bad ObjectId error
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new APIError(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new APIError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
    error = new APIError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new APIError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new APIError(message, 401);
  }

  // Express validator errors
  if (err.array && typeof err.array === "function") {
    const message = err
      .array()
      .map((error) => error.msg)
      .join(", ");
    error = new APIError(message, 400);
  }

  // If it's not an operational error, convert it
  if (!error.isOperational) {
    error = new APIError("Something went wrong", 500);
  }

  // Prepare clean error response (never include stack traces in response)
  const errorResponse = {
    success: false,
    message: error.message || "Internal Server Error",
    status: error.status || "error",
    statusCode: error.statusCode || 500,
  };

  res.status(error.statusCode || 500).json(errorResponse);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Promise Rejection:", err.message);
  console.log("At promise:", promise);

  // Close server and exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err.message);
  console.log("Stack:", err.stack);

  // Close server and exit process
  process.exit(1);
});

module.exports = errorHandler;
