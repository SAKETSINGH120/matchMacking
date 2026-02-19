const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const MatchModel = require("../../models/match/index");

const meetingController = {
  /**
   * POST /api/meetings
   * Request a meeting for an approved match.
   */
  requestMeeting: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId, location, dateTime, notes } = req.body;

    try {
      // Validate dateTime is in the future
      if (new Date(dateTime) <= new Date()) {
        throw APIError.badRequest("Meeting date must be in the future");
      }

      const match = await MatchModel.requestMeeting(matchId, userId, {
        location,
        dateTime,
        notes,
      });

      if (!match) {
        throw APIError.badRequest(
          "Match not found, not approved, or a meeting already exists",
        );
      }

      return APIResponse.send(
        res,
        true,
        201,
        "Meeting request submitted. Waiting for admin approval.",
        {
          matchId: match._id,
          meeting: match.meeting,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/meetings/:matchId
   * Get meeting details for a specific match.
   */
  getMeeting: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.getMatchById(matchId);

      if (!match) {
        throw APIError.notFound("Match not found");
      }

      // Verify user is part of this match
      const isParticipant = match.users.some(
        (u) => u._id.toString() === userId.toString(),
      );
      if (!isParticipant) {
        throw APIError.forbidden("You are not part of this match");
      }

      if (!match.meeting || !match.meeting.status) {
        throw APIError.notFound("No meeting request found for this match");
      }

      // If meeting is not approved yet, only the proposer can see details
      const isProposer =
        match.meeting.proposedBy?._id?.toString() === userId.toString() ||
        match.meeting.proposedBy?.toString() === userId.toString();

      if (match.meeting.status !== "approved" && !isProposer) {
        return APIResponse.send(
          res,
          true,
          200,
          "A meeting request is pending admin approval",
          {
            matchId: match._id,
            meeting: { status: match.meeting.status },
          },
        );
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting retrieved successfully",
        {
          matchId: match._id,
          meeting: match.meeting,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/meetings/:matchId/cancel
   * Cancel a pending meeting (only by the proposer).
   */
  cancelMeeting: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.cancelMeeting(matchId, userId);

      if (!match) {
        throw APIError.notFound(
          "Meeting not found or you are not authorized to cancel it",
        );
      }

      return APIResponse.send(res, true, 200, "Meeting cancelled successfully");
    } catch (error) {
      next(error);
    }
  },
};

module.exports = meetingController;
