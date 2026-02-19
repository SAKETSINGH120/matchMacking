const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meeting/meeting");
const { meetingValidator } = require("../controllers/meeting/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");

// All meeting routes require authentication
router.use(authenticateUser);

// POST /api/meetings — request a meeting for an approved match
router.post(
  "/",
  meetingValidator.requestMeeting,
  asyncHandler(meetingController.requestMeeting),
);

// GET /api/meetings/:matchId — get meeting details for a match
router.get(
  "/:matchId",
  meetingValidator.matchIdParam,
  asyncHandler(meetingController.getMeeting),
);

// PATCH /api/meetings/:matchId/cancel — cancel a pending meeting
router.patch(
  "/:matchId/cancel",
  meetingValidator.matchIdParam,
  asyncHandler(meetingController.cancelMeeting),
);

module.exports = router;
