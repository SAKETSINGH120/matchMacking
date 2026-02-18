const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/admin");
const adminUserController = require("../controllers/admin/adminUserController");
const adminSubscriptionController = require("../controllers/admin/adminSubscriptionController");
const adminDashboardController = require("../controllers/admin/adminDashboardController");
const adminFeedbackController = require("../controllers/admin/adminFeedbackController");
const adminAnalyticsController = require("../controllers/admin/adminAnalyticsController");
const adminMatchController = require("../controllers/admin/adminMatchController");
const adminAuditLogController = require("../controllers/admin/adminAuditLogController");
const adminRoleController = require("../controllers/admin/adminRoleController");
const adminPermissionController = require("../controllers/admin/adminPermissionController");
const { adminValidator } = require("../controllers/admin/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateAdmin, authorize } = require("../middlewares/auth");

// ── Auth (public) ──────────────────────────────────────────
router.post("/signup", asyncHandler(adminController.signup));
router.post("/login", asyncHandler(adminController.login));

// ── All routes below require admin authentication ──────────
router.use(authenticateAdmin);

// ── Dashboard ──────────────────────────────────────────────
router.get(
  "/dashboard",
  authorize("dashboard", "read"),
  asyncHandler(adminDashboardController.getStats),
);

// ── Analytics & Trends ─────────────────────────────────────
router.get(
  "/analytics/user-growth",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getUserGrowth),
);
router.get(
  "/analytics/demographics",
  authorize("analytics", "read"),
  asyncHandler(adminAnalyticsController.getDemographics),
);
router.get(
  "/analytics/engagement",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getEngagementTrends),
);
router.get(
  "/analytics/subscriptions",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getSubscriptionTrends),
);

// ── User Management ────────────────────────────────────────
router.get(
  "/users",
  authorize("users", "read"),
  adminValidator.getUsers,
  asyncHandler(adminUserController.getUsers),
);
router.get(
  "/users/:id",
  authorize("users", "read"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.getUserById),
);
router.patch(
  "/users/:id/block",
  authorize("users", "update"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.blockUser),
);
router.patch(
  "/users/:id/unblock",
  authorize("users", "update"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.unblockUser),
);
router.patch(
  "/users/:id/deactivate",
  authorize("users", "delete"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.deactivateUser),
);

// ── Reports ────────────────────────────────────────────────
router.get(
  "/reports",
  authorize("reports", "read"),
  adminValidator.getReports,
  asyncHandler(adminUserController.getReports),
);
router.patch(
  "/reports/:id/resolve",
  authorize("reports", "update"),
  adminValidator.resolveReport,
  asyncHandler(adminUserController.resolveReport),
);

// ── Match Management ───────────────────────────────────────
router.get(
  "/matches",
  authorize("matches", "read"),
  adminValidator.getMatches,
  asyncHandler(adminMatchController.getMatches),
);
router.get(
  "/matches/stats",
  authorize("matches", "read"),
  asyncHandler(adminMatchController.getMatchStats),
);
router.delete(
  "/matches/:id",
  authorize("matches", "delete"),
  adminValidator.matchIdParam,
  asyncHandler(adminMatchController.unmatchUsers),
);

// ── Subscription Management ───────────────────────────────
router.get(
  "/subscriptions",
  authorize("subscriptions", "read"),
  adminValidator.getSubscriptions,
  asyncHandler(adminSubscriptionController.getSubscriptions),
);
router.get(
  "/subscriptions/premium-users",
  authorize("subscriptions", "read"),
  asyncHandler(adminSubscriptionController.getPremiumUsers),
);
router.get(
  "/subscriptions/revenue",
  authorize("subscriptions", "read"),
  asyncHandler(adminSubscriptionController.getRevenueOverview),
);
router.post(
  "/subscriptions/:userId/activate",
  authorize("subscriptions", "create"),
  adminValidator.activateSubscription,
  asyncHandler(adminSubscriptionController.activateSubscription),
);
router.patch(
  "/subscriptions/:userId/deactivate",
  authorize("subscriptions", "update"),
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.deactivateSubscription),
);
router.post(
  "/subscriptions/:userId/cancel",
  authorize("subscriptions", "delete"),
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.cancelSubscription),
);
router.patch(
  "/subscriptions/:userId/extend",
  authorize("subscriptions", "update"),
  adminValidator.extendSubscription,
  asyncHandler(adminSubscriptionController.extendSubscription),
);

// ── Feedback / Support Tickets ─────────────────────────────
router.get(
  "/feedback",
  authorize("feedback", "read"),
  adminValidator.getTickets,
  asyncHandler(adminFeedbackController.getTickets),
);
router.get(
  "/feedback/stats",
  authorize("feedback", "read"),
  asyncHandler(adminFeedbackController.getStats),
);
router.get(
  "/feedback/ratings",
  authorize("feedback", "read"),
  asyncHandler(adminFeedbackController.getRatings),
);
router.get(
  "/feedback/:id",
  authorize("feedback", "read"),
  adminValidator.ticketIdParam,
  asyncHandler(adminFeedbackController.getTicketById),
);
router.post(
  "/feedback/:id/reply",
  authorize("feedback", "create"),
  adminValidator.replyToTicket,
  asyncHandler(adminFeedbackController.replyToTicket),
);
router.patch(
  "/feedback/:id/status",
  authorize("feedback", "update"),
  adminValidator.updateTicketStatus,
  asyncHandler(adminFeedbackController.updateTicketStatus),
);

// ── Audit Logs ─────────────────────────────────────────────
router.get(
  "/audit-logs",
  authorize("audit_logs", "read"),
  adminValidator.getAuditLogs,
  asyncHandler(adminAuditLogController.getLogs),
);

// ═══════════════════════════════════════════════════════════
// Permission Management (super_admin only)
// ═══════════════════════════════════════════════════════════
router.get(
  "/permissions",
  authorize("permissions", "read"),
  asyncHandler(adminPermissionController.getAll),
);
router.get(
  "/permissions/:id",
  authorize("permissions", "read"),
  asyncHandler(adminPermissionController.getById),
);
router.post(
  "/permissions",
  authorize("permissions", "create"),
  asyncHandler(adminPermissionController.create),
);
router.put(
  "/permissions/:id",
  authorize("permissions", "update"),
  asyncHandler(adminPermissionController.update),
);
router.delete(
  "/permissions/:id",
  authorize("permissions", "delete"),
  asyncHandler(adminPermissionController.delete),
);

// ═══════════════════════════════════════════════════════════
// Role Management (super_admin only)
// ═══════════════════════════════════════════════════════════
router.get(
  "/roles",
  authorize("roles", "read"),
  asyncHandler(adminRoleController.getAll),
);
router.get(
  "/roles/:id",
  authorize("roles", "read"),
  asyncHandler(adminRoleController.getById),
);
router.post(
  "/roles",
  authorize("roles", "create"),
  asyncHandler(adminRoleController.create),
);
router.put(
  "/roles/:id",
  authorize("roles", "update"),
  asyncHandler(adminRoleController.update),
);
router.delete(
  "/roles/:id",
  authorize("roles", "delete"),
  asyncHandler(adminRoleController.delete),
);

// Assign / remove permissions on a role
router.patch(
  "/roles/:id/permissions",
  authorize("roles", "update"),
  asyncHandler(adminRoleController.assignPermissions),
);
router.delete(
  "/roles/:id/permissions",
  authorize("roles", "update"),
  asyncHandler(adminRoleController.removePermissions),
);

module.exports = router;
