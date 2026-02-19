const express = require("express");
const router = express.Router();
const swipeController = require("../controllers/swipe/swipe");
const { swipeValidator } = require("../controllers/swipe/validator");
const { authenticateUser } = require("../middlewares/auth");

// All swipe routes require authentication
router.use(authenticateUser);

// POST /api/swipes/discover — trigger auto-matching by interests & preferences
router.post("/discover", swipeController.discoverMatches);

// POST /api/swipes — record a like, dislike, or superlike
router.post("/", swipeValidator.handleSwipe, swipeController.handleSwipe);

// GET /api/swipes/matches — get all approved matches for the logged-in user
router.get("/matches", swipeValidator.getMatches, swipeController.getMatches);

// GET /api/swipes/matches/pending — get pending matches waiting for approval
router.get("/matches/pending", swipeController.getPendingMatches);

// DELETE /api/swipes/matches/:matchId — unmatch a user
router.delete(
  "/matches/:matchId",
  swipeValidator.unmatch,
  swipeController.unmatch,
);

// GET /api/swipes/likes — get users who liked you (premium)
router.get("/likes", swipeController.getLikesReceived);

module.exports = router;
