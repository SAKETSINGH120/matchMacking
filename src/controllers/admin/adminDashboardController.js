const APIResponse = require("../../utils/APIResponse");
const adminDashboardService = require("../../services/adminDashboardService");

const adminDashboardController = {
  /**
   * GET /api/admin/dashboard
   * Returns aggregated stats: users, matches, premium, reports.
   */
  getStats: async (req, res, next) => {
    try {
      const stats = await adminDashboardService.getStats();

      return APIResponse.send(
        res,
        true,
        200,
        "Dashboard stats retrieved successfully",
        stats,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminDashboardController;
