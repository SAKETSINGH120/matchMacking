const Feedback = require("./Feedback");

module.exports = {
  /**
   * Create a new support ticket from a user.
   */
  createTicket: async ({ userId, category, subject, message }) => {
    return Feedback.create({ userId, category, subject, message });
  },

  /**
   * Get paginated tickets with optional status and category filters.
   */
  getTickets: async ({ status, category, page = 1, limit = 10 }) => {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [tickets, total] = await Promise.all([
      Feedback.find(filter)
        .populate("userId", "name number profilePhoto")
        .populate("repliedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return { tickets, total, page, limit };
  },

  /**
   * Get a single ticket by ID.
   */
  getTicketById: async (ticketId) => {
    return Feedback.findById(ticketId)
      .populate("userId", "name number profilePhoto")
      .populate("repliedBy", "name email")
      .lean();
  },

  /**
   * Admin replies to a ticket and updates its status.
   */
  replyToTicket: async (ticketId, { adminReply, repliedBy, status }) => {
    return Feedback.findByIdAndUpdate(
      ticketId,
      {
        adminReply,
        repliedBy,
        repliedAt: new Date(),
        status: status || "resolved",
      },
      { new: true },
    )
      .populate("userId", "name number")
      .populate("repliedBy", "name email")
      .lean();
  },

  /**
   * Update ticket status (e.g. open → in_progress → closed).
   */
  updateTicketStatus: async (ticketId, status) => {
    return Feedback.findByIdAndUpdate(ticketId, { status }, { new: true })
      .populate("userId", "name number")
      .lean();
  },

  /**
   * Count tickets grouped by status (for dashboard).
   */
  getTicketCounts: async () => {
    const counts = await Feedback.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return counts.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    );
  },
};
