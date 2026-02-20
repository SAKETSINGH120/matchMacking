const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const SwipeModel = require("../../models/swipe/index");
const MatchModel = require("../../models/match/index");
const User = require("../../models/user/User");
const compatibilityService = require("../../services/compatibilityService");
const autoMatchService = require("../../services/autoMatchService");

const swipeController = {
  handleSwipe: async (req, res, next) => {
    const fromUser = req.user._id;
    const { toUser, action } = req.body;

    try {
      if (fromUser.toString() === toUser) {
        throw APIError.badRequest("You cannot swipe on yourself");
      }

      const targetUser = await User.findOne({ _id: toUser, status: "active" })
        .select(
          "interests location lifestyle relationshipGoal lastActiveAt preferences",
        )
        .lean();

      if (!targetUser) {
        throw APIError.notFound("User not found or inactive");
      }

      await SwipeModel.createSwipe(fromUser, toUser, action);

      await User.findByIdAndUpdate(fromUser, {
        lastActiveAt: new Date(),
        $inc: { activityScore: 1 },
      });

      let isMatch = false;
      let matchData = null;

      if (action === "like" || action === "superlike") {
        const mutualLike = await SwipeModel.hasLiked(toUser, fromUser);

        if (mutualLike) {
          const alreadyMatched = await MatchModel.matchExists(fromUser, toUser);

          if (!alreadyMatched) {
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

  getMatches: async (req, res, next) => {
    const userId = req.user._id;
    const matchType = "system"//req.query.type || null;

    try {
      const matches = await MatchModel.getMatchesForUser(userId, matchType);
      console.log("🚀 ~ matches:", matches)

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

  getLikesReceived: async (req, res, next) => {
    const userId = req.user._id;

    try {
      const likes = await SwipeModel.getLikesReceived(userId);

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

  discoverMatches: async (req, res, next) => {
    try {
      const currentUser = req.user;

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
