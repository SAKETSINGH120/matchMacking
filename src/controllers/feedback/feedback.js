const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const FeedbackModel = require("../../models/feedback/index");

const feedbackController = {
  /**
   * POST /api/feedback
   * User submits a support ticket.
   */
  createTicket: async (req, res, next) => {
    try {
      const { category, subject, message } = req.body;

      const ticket = await FeedbackModel.createTicket({
        userId: req.user._id,
        category,
        subject,
        message,
      });

      return APIResponse.send(
        res,
        true,
        201,
        "Support ticket submitted successfully",
        {
          id: ticket._id,
          category: ticket.category,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/feedback/my-tickets
   * User views their own support tickets.
   */
  getMyTickets: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await FeedbackModel.getTickets({
        page,
        limit,
      });

      // Filter to only the current user's tickets (done via query override)
      const Feedback = require("../../models/feedback/Feedback");
      const filter = { userId: req.user._id };

      const [tickets, total] = await Promise.all([
        Feedback.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Feedback.countDocuments(filter),
      ]);

      return APIResponse.send(
        res,
        true,
        200,
        "Your tickets retrieved successfully",
        tickets,
        {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = feedbackController;
