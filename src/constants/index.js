// HTTP Status Codes
const HTTP_STATUS = {
  // Success codes
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error codes
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// API Response Messages
const MESSAGES = {
  // Success messages
  SUCCESS: "Operation completed successfully",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  FETCHED: "Data retrieved successfully",

  // Error messages
  INTERNAL_ERROR: "Internal server error",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  VALIDATION_ERROR: "Validation failed",
  DUPLICATE_ENTRY: "Resource already exists",
  MISSING_FIELDS: "Required fields are missing",
  INVALID_CREDENTIALS: "Invalid credentials provided",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID: "Invalid token provided",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
};

// User Roles (to be used when implementing authentication)
const USER_ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
  GUEST: "guest",
};

// Admin Roles
const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
};

// All permission sections in the system
const PERMISSION_SECTIONS = [
  "dashboard",
  "analytics",
  "users",
  "reports",
  "matches",
  "subscriptions",
  "feedback",
  "audit_logs",
  "roles",
  "permissions",
];

/**
 * Default permissions for each role.
 * Only super_admin gets all permissions automatically.
 * Other roles start empty - super_admin assigns permissions manually.
 */
const DEFAULT_ROLE_PERMISSIONS = {
  // super_admin gets full access to all sections
  [ADMIN_ROLES.SUPER_ADMIN]: "*",

  // admin and moderator start with NO permissions
  // super_admin will assign permissions manually
  [ADMIN_ROLES.ADMIN]: [],
  [ADMIN_ROLES.MODERATOR]: [],
};

// Database Constants
const DB_CONSTANTS = {
  // Connection states
  CONNECTION_STATES: {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    DISCONNECTING: 3,
  },

  // Collection names (to maintain consistency)
  COLLECTIONS: {
    USERS: "users",
    SESSIONS: "sessions",
    LOGS: "logs",
  },
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Swipe Actions
const SWIPE_ACTIONS = {
  LIKE: "like",
  DISLIKE: "dislike",
  SUPERLIKE: "superlike",
};

// Match Status
const MATCH_STATUS = {
  ACTIVE: "active",
  UNMATCHED: "unmatched",
  BLOCKED: "blocked",
};

// Match Types
const MATCH_TYPE = {
  SWIPE: "swipe", // created when both users like each other
  SYSTEM: "system", // created automatically by compatibility engine
};

// Auto-match: minimum compatibility score (0–100) to create a system match
const AUTO_MATCH_THRESHOLD = 70;

// Compatibility Score Weights (must sum to 1.0)
const COMPATIBILITY_WEIGHTS = {
  INTERESTS: 0.3,
  LOCATION: 0.25,
  ACTIVITY: 0.15,
  LIFESTYLE: 0.15,
  RELATIONSHIP_GOAL: 0.15,
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  USER_ROLES,
  ADMIN_ROLES,
  PERMISSION_SECTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DB_CONSTANTS,
  PAGINATION,
  SWIPE_ACTIONS,
  MATCH_STATUS,
  MATCH_TYPE,
  COMPATIBILITY_WEIGHTS,
  AUTO_MATCH_THRESHOLD,
};
