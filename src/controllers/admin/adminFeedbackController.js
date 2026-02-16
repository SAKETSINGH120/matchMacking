const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const FeedbackModel = require("../../models/feedback/index");
const AuditLogModel = require("../../models/auditLog/index");

const adminFeedbackController = {
  /**
   * GET /api/admin/feedback
   * List support tickets with optional status/category filter.
   * Query params: status, category, page, limit
   */
  getTickets: async (req, res, next) => {
    try {
      const { status, category } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await FeedbackModel.getTickets({
        status,
        category,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Tickets retrieved successfully",
        result.tickets,
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
   * GET /api/admin/feedback/:id
   * Get a single ticket's full details.
   */
  getTicketById: async (req, res, next) => {
    try {
      const ticket = await FeedbackModel.getTicketById(req.params.id);

      if (!ticket) {
        throw APIError.notFound("Ticket not found");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Ticket retrieved successfully",
        ticket,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/admin/feedback/:id/reply
   * Admin replies to a support ticket.
   * Body: { adminReply, status? }
   */
  replyToTicket: async (req, res, next) => {
    try {
      const { adminReply, status } = req.body;

      const ticket = await FeedbackModel.replyToTicket(req.params.id, {
        adminReply,
        repliedBy: req.admin._id,
        status,
      });

      if (!ticket) {
        throw APIError.notFound("Ticket not found");
      }

      // Log the admin action
      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reply_ticket",
        targetType: "feedback",
        targetId: req.params.id,
        details: { status: ticket.status },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Ticket replied successfully",
        ticket,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/feedback/:id/status
   * Update ticket status without replying.
   * Body: { status }
   */
  updateTicketStatus: async (req, res, next) => {
    try {
      const { status } = req.body;

      const ticket = await FeedbackModel.updateTicketStatus(
        req.params.id,
        status,
      );

      if (!ticket) {
        throw APIError.notFound("Ticket not found");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Ticket status updated successfully",
        ticket,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/feedback/stats
   * Ticket counts grouped by status (for dashboard cards).
   */
  getTicketStats: async (req, res, next) => {
    try {
      const counts = await FeedbackModel.getTicketCounts();

      return APIResponse.send(
        res,
        true,
        200,
        "Ticket stats retrieved successfully",
        counts,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminFeedbackController;
