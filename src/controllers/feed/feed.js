const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const feedService = require("../../services/feedService");
const autoMatchService = require("../../services/autoMatchService");

const feedController = {
  getFeed: async (req, res, next) => {
    try {
      const currentUser = req.user;

      if (!currentUser.gender || !currentUser.dob) {
        throw APIError.badRequest(
          "Please complete your profile (gender and date of birth) before browsing",
        );
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await feedService.getSuggestedUsers(currentUser, {
        page,
        limit,
      });
      console.log("🚀 ~ result:", result);

      if (page === 1) {
        autoMatchService.generateMatches(currentUser).catch(() => {});
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Feed retrieved successfully",
        result.users,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = feedController;
