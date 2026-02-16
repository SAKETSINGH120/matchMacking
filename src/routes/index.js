const express = require("express");
const router = express.Router();

// Import route modules
const userRoutes = require("./user.routes");
const adminRoutes = require("./admin.routes");
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

// route modules
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
