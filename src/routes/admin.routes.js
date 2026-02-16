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
const { adminValidator } = require("../controllers/admin/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateAdmin } = require("../middlewares/auth");

// ── Auth (public) ──────────────────────────────────────────
router.post("/signup", asyncHandler(adminController.signup));
router.post("/login", asyncHandler(adminController.login));

// ── All routes below require admin authentication ──────────
// router.use(authenticateAdmin);

// ── Dashboard ──────────────────────────────────────────────
router.get("/dashboard", asyncHandler(adminDashboardController.getStats));

// ── Analytics & Trends ─────────────────────────────────────
router.get(
  "/analytics/user-growth",
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getUserGrowth),
);

router.get(
  "/analytics/demographics",
  asyncHandler(adminAnalyticsController.getDemographics),
);

router.get(
  "/analytics/engagement",
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getEngagementTrends),
);

router.get(
  "/analytics/subscriptions",
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getSubscriptionTrends),
);

// ── User Management ────────────────────────────────────────
router.get(
  "/users",
  adminValidator.getUsers,
  asyncHandler(adminUserController.getUsers),
);

router.get(
  "/users/:id",
  adminValidator.userIdParam,
  asyncHandler(adminUserController.getUserById),
);

router.patch(
  "/users/:id/block",
  adminValidator.userIdParam,
  asyncHandler(adminUserController.blockUser),
);

router.patch(
  "/users/:id/unblock",
  adminValidator.userIdParam,
  asyncHandler(adminUserController.unblockUser),
);

router.patch(
  "/users/:id/deactivate",
  adminValidator.userIdParam,
  asyncHandler(adminUserController.deactivateUser),
);

// ── Reports ────────────────────────────────────────────────
router.get(
  "/reports",
  adminValidator.getReports,
  asyncHandler(adminUserController.getReports),
);

router.patch(
  "/reports/:id/resolve",
  adminValidator.resolveReport,
  asyncHandler(adminUserController.resolveReport),
);

// ── Match Management ───────────────────────────────────────
router.get(
  "/matches",
  adminValidator.getMatches,
  asyncHandler(adminMatchController.getMatches),
);

router.get("/matches/stats", asyncHandler(adminMatchController.getMatchStats));

router.delete(
  "/matches/:id",
  adminValidator.matchIdParam,
  asyncHandler(adminMatchController.unmatchUsers),
);

// ── Subscription Management ───────────────────────────────
router.get(
  "/subscriptions",
  adminValidator.getSubscriptions,
  asyncHandler(adminSubscriptionController.getSubscriptions),
);

router.get(
  "/subscriptions/premium-users",
  asyncHandler(adminSubscriptionController.getPremiumUsers),
);

router.get(
  "/subscriptions/revenue",
  asyncHandler(adminSubscriptionController.getRevenueOverview),
);

router.post(
  "/subscriptions/:userId/activate",
  adminValidator.activateSubscription,
  asyncHandler(adminSubscriptionController.activateSubscription),
);

router.patch(
  "/subscriptions/:userId/deactivate",
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.deactivateSubscription),
);

router.post(
  "/subscriptions/:userId/cancel",
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.cancelSubscription),
);

router.patch(
  "/subscriptions/:userId/extend",
  adminValidator.extendSubscription,
  asyncHandler(adminSubscriptionController.extendSubscription),
);

// ── Feedback / Support Tickets ─────────────────────────────
router.get(
  "/feedback",
  adminValidator.getTickets,
  asyncHandler(adminFeedbackController.getTickets),
);

router.get(
  "/feedback/stats",
  asyncHandler(adminFeedbackController.getTicketStats),
);

router.get(
  "/feedback/:id",
  adminValidator.ticketIdParam,
  asyncHandler(adminFeedbackController.getTicketById),
);

router.post(
  "/feedback/:id/reply",
  adminValidator.replyToTicket,
  asyncHandler(adminFeedbackController.replyToTicket),
);

router.patch(
  "/feedback/:id/status",
  adminValidator.updateTicketStatus,
  asyncHandler(adminFeedbackController.updateTicketStatus),
);

// ── Audit Logs ─────────────────────────────────────────────
router.get(
  "/audit-logs",
  adminValidator.getAuditLogs,
  asyncHandler(adminAuditLogController.getLogs),
);

module.exports = router;
