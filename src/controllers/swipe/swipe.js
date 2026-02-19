const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const SwipeModel = require("../../models/swipe/index");
const MatchModel = require("../../models/match/index");
const User = require("../../models/user/User");
const compatibilityService = require("../../services/compatibilityService");
const autoMatchService = require("../../services/autoMatchService");

const swipeController = {
  /**
   * Handle a swipe action (like, dislike, or superlike)
   * - Records the swipe
   * - If both users liked each other, creates a match with compatibility score
   */
  handleSwipe: async (req, res, next) => {
    const fromUser = req.user._id; // authenticated user
    const { toUser, action } = req.body;

    try {
      // Prevent users from swiping on themselves
      if (fromUser.toString() === toUser) {
        throw APIError.badRequest("You cannot swipe on yourself");
      }

      // Verify target user exists and is active
      const targetUser = await User.findOne({ _id: toUser, status: "active" })
        .select(
          "interests location lifestyle relationshipGoal lastActiveAt preferences",
        )
        .lean();

      if (!targetUser) {
        throw APIError.notFound("User not found or inactive");
      }

      // Record the swipe (upsert so re-swipes just update the action)
      await SwipeModel.createSwipe(fromUser, toUser, action);

      // Update activity score for the swiping user
      await User.findByIdAndUpdate(fromUser, {
        lastActiveAt: new Date(),
        $inc: { activityScore: 1 },
      });

      // If the action is "like" or "superlike", check for a mutual match
      let isMatch = false;
      let matchData = null;

      if (action === "like" || action === "superlike") {
        // Did the other user already like us?
        const mutualLike = await SwipeModel.hasLiked(toUser, fromUser);

        if (mutualLike) {
          // Check if a match already exists to prevent duplicates
          const alreadyMatched = await MatchModel.matchExists(fromUser, toUser);

          if (!alreadyMatched) {
            // Calculate compatibility score for the new match
            const score = compatibilityService.calculateScore(
              req.user.toObject ? req.user.toObject() : req.user,
              targetUser,
            );

            const match = await MatchModel.createMatch(
              fromUser,
              toUser,
              score,
              "swipe",
            );
            matchData = {
              matchId: match._id,
              matchType: "swipe",
              compatibilityScore: score,
              status: "pending",
              chatEnabled: false,
            };
          }

          isMatch = true;
        }
      }

      return APIResponse.send(res, true, 200, "Swipe recorded successfully", {
        action,
        isMatch,
        ...(matchData && {
          match: matchData,
          message:
            "Match found! Waiting for admin approval before chat is enabled.",
        }),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all active matches for the authenticated user
   * Query params: ?type=swipe|system (optional — defaults to all)
   */
  getMatches: async (req, res, next) => {
    const userId = req.user._id;
    const matchType = req.query.type || null; // "swipe", "system", or null for all

    try {
      const matches = await MatchModel.getMatchesForUser(userId, matchType);

      // Format matches — exclude current user from the users array
      const formatted = matches.map((match) => {
        const otherUser = match.users.find(
          (u) => u._id.toString() !== userId.toString(),
        );
        return {
          matchId: match._id,
          matchType: match.matchType,
          user: otherUser,
          compatibilityScore: match.compatibilityScore,
          matchedAt: match.matchedAt,
          status: match.status,
          chatEnabled: match.chatEnabled,
          meeting: match.meeting || null,
        };
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Matches retrieved successfully",
        { matches: formatted },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unmatch — deactivate an existing match
   */
  unmatch: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.unmatch(matchId, userId);

      if (!match) {
        throw APIError.notFound("Match not found or already unmatched");
      }

      return APIResponse.send(res, true, 200, "Unmatched successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get users who liked the current user (premium feature)
   */
  getLikesReceived: async (req, res, next) => {
    const userId = req.user._id;

    try {
      const likes = await SwipeModel.getLikesReceived(userId);

      // Filter out users we already swiped on
      const swipedIds = await SwipeModel.getSwipedUserIds(userId);
      const swipedSet = new Set(swipedIds.map((id) => id.toString()));

      const pendingLikes = likes
        .filter((like) => !swipedSet.has(like.fromUser._id.toString()))
        .map((like) => like.fromUser);

      return APIResponse.send(res, true, 200, "Likes retrieved successfully", {
        likes: pendingLikes,
        count: pendingLikes.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/swipes/matches/pending
   * Get pending matches waiting for admin approval.
   */
  getPendingMatches: async (req, res, next) => {
    const userId = req.user._id;

    try {
      const matches = await MatchModel.getPendingMatchesForUser(userId);

      const formatted = matches.map((match) => {
        const otherUser = match.users.find(
          (u) => u._id.toString() !== userId.toString(),
        );
        return {
          matchId: match._id,
          matchType: match.matchType,
          user: otherUser,
          compatibilityScore: match.compatibilityScore,
          matchedAt: match.matchedAt,
          status: "pending",
        };
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Pending matches retrieved successfully",
        { matches: formatted },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/swipes/discover
   * Triggers the auto-match engine for the current user.
   * Finds users whose interests, preferences, location, lifestyle,
   * and activity produce a compatibility score above the threshold
   * and creates "system" matches for them automatically.
   */
  discoverMatches: async (req, res, next) => {
    try {
      const currentUser = req.user;

      // Ensure the user has minimum profile data
      if (!currentUser.gender || !currentUser.dob) {
        throw APIError.badRequest(
          "Please complete your profile (gender and date of birth) before discovering matches",
        );
      }

      const threshold = parseInt(req.body.threshold, 10) || undefined;
      const maxMatches = parseInt(req.body.maxMatches, 10) || undefined;

      const result = await autoMatchService.generateMatches(currentUser, {
        ...(threshold && { threshold }),
        ...(maxMatches && { maxMatches }),
      });

      return APIResponse.send(
        res,
        true,
        200,
        result.newMatches.length > 0
          ? `${result.newMatches.length} new match(es) discovered!`
          : "No new matches found at this time",
        {
          newMatches: result.newMatches,
          totalCandidatesEvaluated: result.totalCandidates,
        },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = swipeController;
