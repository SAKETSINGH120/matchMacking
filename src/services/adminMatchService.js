const Match = require("../models/match/Match");
const Swipe = require("../models/swipe/Swipe");

/**
 * Admin Match Service
 * View and manage matches from the admin panel.
 */
const adminMatchService = {
  /**
   * Get paginated matches with optional userId filter.
   * Populates both users with basic profile info.
   */
  getMatches: async ({ userId, page = 1, limit = 10 }) => {
    const filter = {};
    if (userId) filter.users = userId;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("users", "name number profilePhoto gender status isPremium")
        .sort({ matchedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page, limit };
  },

  /**
   * Unmatch two users — removes the match document and
   * resets both swipe records so they can re-appear in each other's feed.
   */
  unmatchUsers: async (matchId) => {
    const match = await Match.findById(matchId);
    if (!match) return null;

    const [userA, userB] = match.users;

    // Remove the mutual swipes so they reappear in each other's feed
    await Swipe.deleteMany({
      $or: [
        { fromUser: userA, toUser: userB },
        { fromUser: userB, toUser: userA },
      ],
    });

    // Remove the match document itself
    await Match.findByIdAndDelete(matchId);

    return { userA, userB };
  },

  /**
   * Get match stats — total matches, matches today, this week, this month.
   */
  getMatchStats: async () => {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      Match.countDocuments(),
      Match.countDocuments({ matchedAt: { $gte: startOfToday } }),
      Match.countDocuments({ matchedAt: { $gte: startOfWeek } }),
      Match.countDocuments({ matchedAt: { $gte: startOfMonth } }),
    ]);

    return { total, today, thisWeek, thisMonth };
  },
};

module.exports = adminMatchService;
