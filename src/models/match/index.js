const Match = require("./Match");

module.exports = {
  // Create a new match between two users (stores sorted IDs to prevent duplicates)
  createMatch: async (userIdA, userIdB) => {
    // Sort IDs so [A,B] and [B,A] always produce the same document
    const sortedUsers = [userIdA, userIdB].sort();

    const match = await Match.findOneAndUpdate(
      { users: sortedUsers },
      { users: sortedUsers, matchedAt: new Date() },
      { upsert: true, new: true },
    );
    return match;
  },

  // Check if a match already exists between two users
  matchExists: async (userIdA, userIdB) => {
    const sortedUsers = [userIdA, userIdB].sort();
    const match = await Match.findOne({ users: sortedUsers }).lean();
    return !!match;
  },

  // Get all matches for a user
  getMatchesForUser: async (userId) => {
    return Match.find({ users: userId })
      .populate("users", "name profilePhoto bio")
      .sort({ matchedAt: -1 })
      .lean();
  },
};
