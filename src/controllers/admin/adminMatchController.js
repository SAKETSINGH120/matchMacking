const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminMatchService = require("../../services/adminMatchService");
const AuditLogModel = require("../../models/auditLog/index");

const adminMatchController = {
  /**
   * GET /api/admin/matches
   * List all matches with optional userId filter.
   * Query params: userId, page, limit
   */
  getMatches: async (req, res, next) => {
    try {
      const { userId } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminMatchService.getMatches({
        userId,
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
   * DELETE /api/admin/matches/:id
   * Unmatch two users — removes match and clears swipe history between them.
   */
  unmatchUsers: async (req, res, next) => {
    try {
      const result = await adminMatchService.unmatchUsers(req.params.id);

      if (!result) {
        throw APIError.notFound("Match not found");
      }

      // Log the admin action
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

  /**
   * GET /api/admin/matches/stats
   * Match statistics — total, today, this week, this month.
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
