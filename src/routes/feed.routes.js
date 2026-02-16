const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed/feed");
const { feedValidator } = require("../controllers/feed/validator");
const { authenticateUser } = require("../middlewares/auth");

// All feed routes require authentication
router.use(authenticateUser);

// GET /api/feed — get suggested users for the current user
router.get("/", feedValidator.getFeed, feedController.getFeed);

module.exports = router;
