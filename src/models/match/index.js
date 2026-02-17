const Match = require("./Match");

module.exports = {
  // Create a new match between two users with compatibility score
  createMatch: async (
    userIdA,
    userIdB,
    compatibilityScore = 0,
    matchType = "swipe",
  ) => {
    // Sort IDs so [A,B] and [B,A] always produce the same document
    const sortedUsers = [userIdA, userIdB].sort();

    const match = await Match.findOneAndUpdate(
      { users: sortedUsers },
      {
        users: sortedUsers,
        matchedAt: new Date(),
        compatibilityScore,
        matchType,
        status: "active",
      },
      { upsert: true, new: true },
    );
    return match;
  },

  // Check if a match already exists between two users
  matchExists: async (userIdA, userIdB) => {
    const sortedUsers = [userIdA, userIdB].sort();
    const match = await Match.findOne({
      users: sortedUsers,
      status: "active",
    }).lean();
    return !!match;
  },

  // Get all active matches for a user (optionally filter by matchType)
  getMatchesForUser: async (userId, matchType = null) => {
    const filter = { users: userId, status: "active" };
    if (matchType) {
      filter.matchType = matchType;
    }
    return Match.find(filter)
      .populate(
        "users",
        "name profilePhoto bio lastActiveAt interests location.city",
      )
      .sort({ matchedAt: -1 })
      .lean();
  },

  // Unmatch: deactivate a match
  unmatch: async (matchId, userId) => {
    const match = await Match.findOneAndUpdate(
      { _id: matchId, users: userId, status: "active" },
      { status: "unmatched", unmatchedBy: userId, unmatchedAt: new Date() },
      { new: true },
    );
    return match;
  },

  // Get match by ID
  getMatchById: async (matchId) => {
    return Match.findById(matchId)
      .populate("users", "name profilePhoto bio")
      .lean();
  },
};
