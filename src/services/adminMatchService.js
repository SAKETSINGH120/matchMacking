const Match = require("../models/match/Match");
const MatchModel = require("../models/match/index");
const Swipe = require("../models/swipe/Swipe");

/**
 * Admin Match Service
 * View and manage matches + meetings from the admin panel.
 */
const adminMatchService = {
  /**
   * Get paginated matches with optional userId and status filter.
   */
  getMatches: async ({ userId, status, page = 1, limit = 10 }) => {
    const filter = {};
    if (userId) filter.users = userId;
    if (status) filter.status = status;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("users", "name number profilePhoto gender status isPremium")
        .populate("moderatedBy", "name email")
        .sort({ matchedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page, limit };
  },

  /**
   * Approve a pending match — enables chat.
   */
  approveMatch: async (matchId, adminId, adminNote) => {
    return MatchModel.approveMatch(matchId, adminId, adminNote);
  },

  /**
   * Reject a pending match.
   */
  rejectMatch: async (matchId, adminId, adminNote) => {
    return MatchModel.rejectMatch(matchId, adminId, adminNote);
  },

  /**
   * Unmatch two users — removes match and clears swipe records.
   */
  unmatchUsers: async (matchId) => {
    const match = await Match.findById(matchId);
    if (!match) return null;

    const [userA, userB] = match.users;

    await Swipe.deleteMany({
      $or: [
        { fromUser: userA, toUser: userB },
        { fromUser: userB, toUser: userA },
      ],
    });

    await Match.findByIdAndDelete(matchId);
    return { userA, userB };
  },

  // ── Meeting Management ───────────────────────────────────

  /**
   * Get matches that have meeting requests with optional status filter.
   */
  getMeetings: async ({ meetingStatus, page = 1, limit = 10 }) => {
    const filter = { "meeting.status": { $exists: true } };
    if (meetingStatus) filter["meeting.status"] = meetingStatus;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("users", "name number profilePhoto gender")
        .populate("meeting.proposedBy", "name profilePhoto")
        .populate("meeting.moderatedBy", "name email")
        .sort({ "meeting.dateTime": -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page, limit };
  },

  /**
   * Approve a meeting request.
   */
  approveMeeting: async (matchId, adminId, adminNote) => {
    return MatchModel.approveMeeting(matchId, adminId, adminNote);
  },

  /**
   * Reject a meeting request.
   */
  rejectMeeting: async (matchId, adminId, adminNote) => {
    return MatchModel.rejectMeeting(matchId, adminId, adminNote);
  },

  /**
   * Update meeting status (completed, cancelled, etc.).
   */
  updateMeetingStatus: async (matchId, status, adminId) => {
    return MatchModel.updateMeetingStatus(matchId, status, adminId);
  },

  // ── Stats ────────────────────────────────────────────────

  /**
   * Match + meeting stats.
   */
  getMatchStats: async () => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      pending,
      approved,
      rejected,
      today,
      thisWeek,
      thisMonth,
      meetingsPending,
      meetingsApproved,
    ] = await Promise.all([
      Match.countDocuments(),
      Match.countDocuments({ status: "pending" }),
      Match.countDocuments({ status: "approved" }),
      Match.countDocuments({ status: "rejected" }),
      Match.countDocuments({ matchedAt: { $gte: startOfToday } }),
      Match.countDocuments({ matchedAt: { $gte: startOfWeek } }),
      Match.countDocuments({ matchedAt: { $gte: startOfMonth } }),
      Match.countDocuments({ "meeting.status": "pending" }),
      Match.countDocuments({ "meeting.status": "approved" }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      today,
      thisWeek,
      thisMonth,
      meetings: { pending: meetingsPending, approved: meetingsApproved },
    };
  },
};

module.exports = adminMatchService;
