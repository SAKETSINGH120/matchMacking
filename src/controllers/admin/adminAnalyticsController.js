const APIResponse = require("../../utils/APIResponse");
const adminAnalyticsService = require("../../services/adminAnalyticsService");

const adminAnalyticsController = {
  /**
   * GET /api/admin/analytics/user-growth?days=30
   * Daily signup counts over the past N days.
   */
  getUserGrowth: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const growth = await adminAnalyticsService.getUserGrowth(days);

      return APIResponse.send(
        res,
        true,
        200,
        "User growth data retrieved successfully",
        growth,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/analytics/demographics
   * Gender and age distribution of active users.
   */
  getDemographics: async (req, res, next) => {
    try {
      const [genderDistribution, ageDistribution] = await Promise.all([
        adminAnalyticsService.getGenderDistribution(),
        adminAnalyticsService.getAgeDistribution(),
      ]);

      return APIResponse.send(
        res,
        true,
        200,
        "Demographics retrieved successfully",
        { gender: genderDistribution, age: ageDistribution },
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/analytics/engagement?days=30
   * Daily swipe and match trends.
   */
  getEngagementTrends: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const trends = await adminAnalyticsService.getEngagementTrends(days);

      return APIResponse.send(
        res,
        true,
        200,
        "Engagement trends retrieved successfully",
        trends,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/analytics/subscriptions?days=30
   * Daily subscription trends by plan.
   */
  getSubscriptionTrends: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const trends = await adminAnalyticsService.getSubscriptionTrends(days);

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription trends retrieved successfully",
        trends,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminAnalyticsController;
