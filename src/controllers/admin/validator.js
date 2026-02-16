const { body, param, query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const adminValidator = {
  // ── User Management ──────────────────────────────────────

  // Validate query params for listing users
  getUsers: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["active", "blocked", "deleted"])
      .withMessage("Status must be active, blocked, or deleted"),
    query("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    query("isPremium")
      .optional()
      .isIn(["true", "false"])
      .withMessage("isPremium must be true or false"),
    query("isVerified")
      .optional()
      .isIn(["true", "false"])
      .withMessage("isVerified must be true or false"),
  ]),

  // Validate userId as a route param
  userIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid user ID format"),
  ]),

  // Validate resolve-report body
  resolveReport: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid report ID format"),
    body("status")
      .notEmpty()
      .withMessage("Resolution status is required")
      .isIn(["resolved", "dismissed"])
      .withMessage("Status must be resolved or dismissed"),
    body("adminNote")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Admin note must be at most 500 characters"),
  ]),

  // Validate report listing query params
  getReports: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["pending", "reviewed", "resolved", "dismissed"])
      .withMessage("Invalid report status"),
  ]),

  // ── Subscription Management ──────────────────────────────

  // Validate query params for listing subscriptions
  getSubscriptions: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["active", "expired", "cancelled"])
      .withMessage("Status must be active, expired, or cancelled"),
    query("plan")
      .optional()
      .isIn(["basic", "gold", "platinum"])
      .withMessage("Plan must be basic, gold, or platinum"),
  ]),

  // Validate activate subscription body
  activateSubscription: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
    body("plan")
      .notEmpty()
      .withMessage("Plan is required")
      .isIn(["basic", "gold", "platinum"])
      .withMessage("Plan must be basic, gold, or platinum"),
    body("durationDays")
      .notEmpty()
      .withMessage("Duration in days is required")
      .isInt({ min: 1, max: 365 })
      .withMessage("Duration must be between 1 and 365 days"),
  ]),

  // Validate userId param for subscription actions
  subscriptionUserParam: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
  ]),

  // Validate extend subscription body
  extendSubscription: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
    body("extraDays")
      .notEmpty()
      .withMessage("Extra days is required")
      .isInt({ min: 1, max: 365 })
      .withMessage("Extra days must be between 1 and 365"),
  ]),

  // ── Feedback / Support Tickets ───────────────────────────

  getTickets: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["open", "in_progress", "resolved", "closed"])
      .withMessage("Invalid ticket status"),
    query("category")
      .optional()
      .isIn([
        "bug",
        "account_issue",
        "payment",
        "safety",
        "feature_request",
        "other",
      ])
      .withMessage("Invalid ticket category"),
  ]),

  ticketIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
  ]),

  replyToTicket: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
    body("adminReply")
      .notEmpty()
      .withMessage("Reply message is required")
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Reply must be at most 2000 characters"),
    body("status")
      .optional()
      .isIn(["in_progress", "resolved", "closed"])
      .withMessage("Status must be in_progress, resolved, or closed"),
  ]),

  updateTicketStatus: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["open", "in_progress", "resolved", "closed"])
      .withMessage("Invalid ticket status"),
  ]),

  // ── Match Management ─────────────────────────────────────

  matchIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid match ID format"),
  ]),

  getMatches: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("userId")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID format"),
  ]),

  // ── Analytics ────────────────────────────────────────────

  analyticsDays: withErrorHandling([
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ]),

  // ── Audit Logs ───────────────────────────────────────────

  getAuditLogs: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("adminId")
      .optional()
      .isMongoId()
      .withMessage("Invalid admin ID format"),
    query("targetType")
      .optional()
      .isIn(["user", "subscription", "report", "feedback"])
      .withMessage("Invalid target type"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
  ]),
};

module.exports = { adminValidator };
