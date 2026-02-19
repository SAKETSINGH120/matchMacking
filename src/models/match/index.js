const Match = require("./Match");

module.exports = {
  // Create a new match (starts as "pending" for admin moderation)
  createMatch: async (
    userIdA,
    userIdB,
    compatibilityScore = 0,
    matchType = "swipe",
  ) => {
    const sortedUsers = [userIdA, userIdB].sort();

    const match = await Match.findOneAndUpdate(
      { users: sortedUsers },
      {
        users: sortedUsers,
        matchedAt: new Date(),
        compatibilityScore,
        matchType,
        status: "pending",
        chatEnabled: false,
      },
      { upsert: true, new: true },
    );
    return match;
  },

  // Check if a match already exists (pending or approved)
  matchExists: async (userIdA, userIdB) => {
    const sortedUsers = [userIdA, userIdB].sort();
    const match = await Match.findOne({
      users: sortedUsers,
      status: { $in: ["pending", "approved"] },
    }).lean();
    return !!match;
  },

  // Get approved matches for a user (only approved ones are visible)
  getMatchesForUser: async (userId, matchType = null) => {
    const filter = { users: userId, status: "approved" };
    if (matchType) filter.matchType = matchType;

    return Match.find(filter)
      .populate(
        "users",
        "name profilePhoto bio lastActiveAt interests location.city",
      )
      .sort({ matchedAt: -1 })
      .lean();
  },

  // Get pending matches for a user
  getPendingMatchesForUser: async (userId) => {
    return Match.find({ users: userId, status: "pending" })
      .populate("users", "name profilePhoto bio interests location.city")
      .sort({ matchedAt: -1 })
      .lean();
  },

  // Admin: approve a match — enables chat
  approveMatch: async (matchId, adminId, adminNote = null) => {
    const update = {
      status: "approved",
      chatEnabled: true,
      moderatedBy: adminId,
      moderatedAt: new Date(),
    };
    if (adminNote) update.adminNote = adminNote;

    return Match.findOneAndUpdate({ _id: matchId, status: "pending" }, update, {
      new: true,
    })
      .populate("users", "name profilePhoto")
      .lean();
  },

  // Admin: reject a match
  rejectMatch: async (matchId, adminId, adminNote = null) => {
    const update = {
      status: "rejected",
      chatEnabled: false,
      moderatedBy: adminId,
      moderatedAt: new Date(),
    };
    if (adminNote) update.adminNote = adminNote;

    return Match.findOneAndUpdate({ _id: matchId, status: "pending" }, update, {
      new: true,
    })
      .populate("users", "name profilePhoto")
      .lean();
  },

  // ── Meeting helpers (embedded in match) ──────────────────

  // Request a meeting on an approved match
  requestMeeting: async (matchId, userId, { location, dateTime, notes }) => {
    return Match.findOneAndUpdate(
      {
        _id: matchId,
        status: "approved",
        "meeting.status": { $exists: false },
      },
      {
        meeting: {
          proposedBy: userId,
          location,
          dateTime,
          notes,
          status: "pending",
        },
      },
      { new: true },
    )
      .populate("users", "name profilePhoto")
      .populate("meeting.proposedBy", "name profilePhoto")
      .lean();
  },

  // Cancel a pending meeting (only by proposer)
  cancelMeeting: async (matchId, userId) => {
    return Match.findOneAndUpdate(
      {
        _id: matchId,
        "meeting.proposedBy": userId,
        "meeting.status": "pending",
      },
      { $unset: { meeting: 1 } },
      { new: true },
    ).lean();
  },

  // Admin: approve a meeting
  approveMeeting: async (matchId, adminId, adminNote = null) => {
    const update = {
      "meeting.status": "approved",
      "meeting.moderatedBy": adminId,
      "meeting.moderatedAt": new Date(),
    };
    if (adminNote) update["meeting.adminNote"] = adminNote;

    return Match.findOneAndUpdate(
      { _id: matchId, "meeting.status": "pending" },
      update,
      { new: true },
    )
      .populate("users", "name profilePhoto")
      .populate("meeting.proposedBy", "name profilePhoto")
      .lean();
  },

  // Admin: reject a meeting
  rejectMeeting: async (matchId, adminId, adminNote = null) => {
    const update = {
      "meeting.status": "rejected",
      "meeting.moderatedBy": adminId,
      "meeting.moderatedAt": new Date(),
    };
    if (adminNote) update["meeting.adminNote"] = adminNote;

    return Match.findOneAndUpdate(
      { _id: matchId, "meeting.status": "pending" },
      update,
      { new: true },
    )
      .populate("users", "name profilePhoto")
      .populate("meeting.proposedBy", "name profilePhoto")
      .lean();
  },

  // Admin: update meeting status (completed, etc.)
  updateMeetingStatus: async (matchId, status, adminId) => {
    return Match.findOneAndUpdate(
      { _id: matchId, "meeting.status": { $exists: true } },
      {
        "meeting.status": status,
        "meeting.moderatedBy": adminId,
        "meeting.moderatedAt": new Date(),
      },
      { new: true },
    )
      .populate("users", "name profilePhoto")
      .lean();
  },

  // Unmatch: deactivate a match
  unmatch: async (matchId, userId) => {
    const match = await Match.findOneAndUpdate(
      { _id: matchId, users: userId, status: "approved" },
      {
        status: "unmatched",
        chatEnabled: false,
        unmatchedBy: userId,
        unmatchedAt: new Date(),
      },
      { new: true },
    );
    return match;
  },

  // Get match by ID
  getMatchById: async (matchId) => {
    return Match.findById(matchId)
      .populate("users", "name profilePhoto bio")
      .populate("meeting.proposedBy", "name profilePhoto")
      .lean();
  },
};
