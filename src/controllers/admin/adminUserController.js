const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminUserService = require("../../services/adminUserService");
const ReportModel = require("../../models/report/index");
const AuditLogModel = require("../../models/auditLog/index");

const adminUserController = {
  /**
   * GET /api/admin/users
   * List all users with pagination, search, and filters.
   * Query params: search, status, gender, isPremium, isVerified, page, limit
   */
  getUsers: async (req, res, next) => {
    try {
      const { search, status, gender, isPremium, isVerified } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminUserService.getUsers({
        search,
        status,
        gender,
        isPremium,
        isVerified,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Users retrieved successfully",
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

  /**
   * GET /api/admin/users/:id
   * Get a single user's details.
   */
  getUserById: async (req, res, next) => {
    try {
      const user = await adminUserService.getUserById(req.params.id);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "User retrieved successfully",
        user,
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/users/:id/block
   * Block a user.
   */
  blockUser: async (req, res, next) => {
    try {
      const user = await adminUserService.blockUser(req.params.id);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      // Log the admin action
      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "block_user",
        targetType: "user",
        targetId: req.params.id,
        details: { previousStatus: "active" },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "User blocked successfully", {
        id: user._id,
        name: user.name,
        status: user.status,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/users/:id/unblock
   * Unblock a user.
   */
  unblockUser: async (req, res, next) => {
    try {
      const user = await adminUserService.unblockUser(req.params.id);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "unblock_user",
        targetType: "user",
        targetId: req.params.id,
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "User unblocked successfully", {
        id: user._id,
        name: user.name,
        status: user.status,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/users/:id/deactivate
   * Soft-delete a user (sets status to "deleted").
   */
  deactivateUser: async (req, res, next) => {
    try {
      const user = await adminUserService.deactivateUser(req.params.id);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "deactivate_user",
        targetType: "user",
        targetId: req.params.id,
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "User deactivated successfully", {
        id: user._id,
        name: user.name,
        status: user.status,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/reports
   * List reported users with pagination and optional status filter.
   * Query params: status, page, limit
   */
  getReports: async (req, res, next) => {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await ReportModel.getReports({ status, page, limit });

      return APIResponse.send(
        res,
        true,
        200,
        "Reports retrieved successfully",
        result.reports,
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

  /**
   * PATCH /api/admin/reports/:id/resolve
   * Resolve or dismiss a report.
   * Body: { status: "resolved" | "dismissed", adminNote }
   */
  resolveReport: async (req, res, next) => {
    try {
      const { status, adminNote } = req.body;

      const report = await ReportModel.resolveReport(req.params.id, {
        status,
        adminNote,
        resolvedBy: req.admin._id,
      });

      if (!report) {
        throw APIError.notFound("Report not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "resolve_report",
        targetType: "report",
        targetId: req.params.id,
        details: { resolution: status },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Report resolved successfully",
        report,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminUserController;
