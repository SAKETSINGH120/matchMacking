const express = require("express");
const router = express.Router();

// Import route modules
const sampleRoutes = require("./sample.routes");
const asyncHandler = require("../utils/asyncHandler");

// Health check
router.get(
  "/health",
  asyncHandler((req, res) => {
    return res.json({
      success: true,
      message: "Server is running and healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }),
);

// Mount sample routes
router.use("/", sampleRoutes);

module.exports = router;
