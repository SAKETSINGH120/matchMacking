const express = require("express");
const router = express.Router();
const sampleController = require("../controllers/sample.controller");
const auth = require("../middlewares/auth");

// Public endpoint
router.get("/public-endpoint", sampleController.getPublicData);

// Protected endpoint
router.get(
  "/protected-endpoint",
  auth.verifyToken,
  sampleController.getProtectedData,
);

// Create resource
router.post(
  "/create-resource",
  auth.verifyToken,
  sampleController.createResource,
);

// Update resource
router.put(
  "/update-resource/:id",
  auth.verifyToken,
  sampleController.updateResource,
);

// Delete resource
router.delete(
  "/delete-resource/:id",
  auth.verifyToken,
  sampleController.deleteResource,
);

// Admin only
router.get("/admin-only", auth.verifyToken, sampleController.getAdminData);

module.exports = router;
