const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const FeedbackModel = require("../../models/feedback/index");
const AuditLogModel = require("../../models/auditLog/index");

const adminFeedbackController = {
  // ── Support Tickets ────────────────────────────────────

  /**
   * GET /api/admin/feedback
   */
  getTickets: async (req, res, next) => {
    try {
      const { status, category } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await FeedbackModel.getTickets({ status, category, page, limit });

      return APIResponse.send(res, true, 200, "Tickets fetched", result.tickets, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/feedback/:id
   */
  getTicketById: async (req, res, next) => {
    try {
      const ticket = await FeedbackModel.getTicketById(req.params.id);
      if (!ticket) throw APIError.notFound("Ticket not found");
      return APIResponse.send(res, true, 200, "Ticket fetched", ticket);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/admin/feedback/:id/reply
   */
  replyToTicket: async (req, res, next) => {
    try {
      const { adminReply, status } = req.body;

      const ticket = await FeedbackModel.replyToTicket(req.params.id, {
        adminReply,
        repliedBy: req.admin._id,
        status,
      });

      if (!ticket) throw APIError.notFound("Ticket not found");

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reply_ticket",
        targetType: "feedback",
        targetId: req.params.id,
        details: { status: ticket.status },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "Ticket replied", ticket);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/feedback/:id/status
   */
  updateTicketStatus: async (req, res, next) => {
    try {
      const ticket = await FeedbackModel.updateTicketStatus(req.params.id, req.body.status);
      if (!ticket) throw APIError.notFound("Ticket not found");
      return APIResponse.send(res, true, 200, "Status updated", ticket);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/feedback/stats
   * Ticket counts + platform avg rating in one call.
   */
  getStats: async (req, res, next) => {
    try {
      const [ticketCounts, platformStats] = await Promise.all([
        FeedbackModel.getTicketCounts(),
        FeedbackModel.getPlatformAvgRating(),
      ]);

      return APIResponse.send(res, true, 200, "Feedback stats fetched", {
        tickets: ticketCounts,
        platform: platformStats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/feedback/ratings
   * All user ratings (partner + platform) for admin review.
   */
  getRatings: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const Feedback = require("../../models/feedback/Feedback");
      const filter = { type: "rating" };

      const [ratings, total] = await Promise.all([
        Feedback.find(filter)
          .populate("userId", "name number profilePhoto")
          .populate("matchId")
          .select("userId matchId partnerRating platformRating comment createdAt")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Feedback.countDocuments(filter),
      ]);

      return APIResponse.send(res, true, 200, "Ratings fetched", ratings, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminFeedbackController;
