const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminMatchService = require("../../services/adminMatchService");
const AuditLogModel = require("../../models/auditLog/index");

const adminMatchController = {
  /**
   * GET /api/admin/matches
   * Query params: userId, status, page, limit
   */
  getMatches: async (req, res, next) => {
    try {
      const { userId, status } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminMatchService.getMatches({
        userId,
        status,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Matches retrieved successfully",
        result.matches,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/matches/:id/approve
   * Approve a pending match — enables chat.
   */
  approveMatch: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.approveMatch(
        req.params.id,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Match not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "approve_match",
        targetType: "match",
        targetId: req.params.id,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Match approved — chat enabled",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/matches/:id/reject
   * Reject a pending match.
   */
  rejectMatch: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.rejectMatch(
        req.params.id,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Match not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reject_match",
        targetType: "match",
        targetId: req.params.id,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Match rejected successfully",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/admin/matches/:id
   * Unmatch two users — removes match and clears swipe history.
   */
  unmatchUsers: async (req, res, next) => {
    try {
      const result = await adminMatchService.unmatchUsers(req.params.id);

      if (!result) {
        throw APIError.notFound("Match not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "unmatch_users",
        targetType: "user",
        targetId: req.params.id,
        details: { userA: result.userA, userB: result.userB },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "Users unmatched successfully", {
        userA: result.userA,
        userB: result.userB,
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Meeting Management ───────────────────────────────────

  /**
   * GET /api/admin/meetings
   * Query params: meetingStatus, page, limit
   */
  getMeetings: async (req, res, next) => {
    try {
      const { meetingStatus } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminMatchService.getMeetings({
        meetingStatus,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting requests retrieved successfully",
        result.matches,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/meetings/:matchId/approve
   */
  approveMeeting: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.approveMeeting(
        req.params.matchId,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "approve_meeting",
        targetType: "match",
        targetId: req.params.matchId,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting approved successfully",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/meetings/:matchId/reject
   */
  rejectMeeting: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.rejectMeeting(
        req.params.matchId,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reject_meeting",
        targetType: "match",
        targetId: req.params.matchId,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting rejected successfully",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/meetings/:matchId/status
   * Update meeting status (completed, cancelled, etc.)
   */
  updateMeetingStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const match = await adminMatchService.updateMeetingStatus(
        req.params.matchId,
        status,
        req.admin._id,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "update_meeting_status",
        targetType: "match",
        targetId: req.params.matchId,
        details: { status },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        `Meeting status updated to ${status}`,
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/matches/stats
   */
  getMatchStats: async (req, res, next) => {
    try {
      const stats = await adminMatchService.getMatchStats();

      return APIResponse.send(
        res,
        true,
        200,
        "Match stats retrieved successfully",
        stats,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminMatchController;
