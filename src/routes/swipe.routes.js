const express = require("express");
const router = express.Router();
const swipeController = require("../controllers/swipe/swipe");
const { swipeValidator } = require("../controllers/swipe/validator");
const { authenticateUser } = require("../middlewares/auth");

// All swipe routes require authentication
router.use(authenticateUser);

// POST /api/swipes — record a like or dislike
router.post("/", swipeValidator.handleSwipe, swipeController.handleSwipe);

// GET /api/swipes/matches — get all matches for the logged-in user
router.get("/matches", swipeController.getMatches);

module.exports = router;
