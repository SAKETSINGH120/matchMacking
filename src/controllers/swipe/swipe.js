const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const SwipeModel = require("../../models/swipe/index");
const MatchModel = require("../../models/match/index");

const swipeController = {
  /**
   * Handle a swipe action (like or dislike)
   * - Records the swipe
   * - If both users liked each other, creates a match
   */
  handleSwipe: async (req, res, next) => {
    const fromUser = req.user._id; // authenticated user
    const { toUser, action } = req.body;

    try {
      // Prevent users from swiping on themselves
      if (fromUser.toString() === toUser) {
        throw APIError.badRequest("You cannot swipe on yourself");
      }

      // Record the swipe (upsert so re-swipes just update the action)
      await SwipeModel.createSwipe(fromUser, toUser, action);

      // If the action is "like", check for a mutual match
      let isMatch = false;

      if (action === "like") {
        // Did the other user already like us?
        const mutualLike = await SwipeModel.hasLiked(toUser, fromUser);

        if (mutualLike) {
          // Check if a match already exists to prevent duplicates
          const alreadyMatched = await MatchModel.matchExists(fromUser, toUser);

          if (!alreadyMatched) {
            await MatchModel.createMatch(fromUser, toUser);
          }

          isMatch = true;
        }
      }

      return APIResponse.send(res, true, 200, "Swipe recorded successfully", {
        action,
        isMatch,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all matches for the authenticated user
   */
  getMatches: async (req, res, next) => {
    const userId = req.user._id;

    try {
      const matches = await MatchModel.getMatchesForUser(userId);

      return APIResponse.send(
        res,
        true,
        200,
        "Matches retrieved successfully",
        { matches },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = swipeController;
