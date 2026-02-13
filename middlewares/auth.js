const jwt = require("jsonwebtoken");
const config = require("../config/config");
const APIResponse = require("../utils/APIResponse");
const APIError = require("../utils/APIError");

// Authentication middleware placeholder
// This will be implemented when authentication features are added
const authMiddleware = {
  // Verify JWT token
  verifyToken: (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return APIResponse.error(
          res,
          new APIError("Access denied. Token not provided.", 401),
        );
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return APIResponse.error(res, new APIError("Invalid token.", 401));
      } else if (error.name === "TokenExpiredError") {
        return APIResponse.error(res, new APIError("Token expired.", 401));
      }
      return APIResponse.error(
        res,
        new APIError("Token verification failed.", 401),
      );
    }
  },

  // Check if user has specific role (to be implemented later)
  requireRole: (roles) => {
    return (req, res, next) => {
      // This will be implemented when user roles are defined
      if (!req.user) {
        return APIResponse.error(
          res,
          new APIError("Authentication required.", 401),
        );
      }

      // Role checking logic will be added here
      // For now, just proceed
      next();
    };
  },

  // Optional authentication (doesn't fail if no token)
  optionalAuth: (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (token) {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
      }

      next();
    } catch (error) {
      // If token is invalid, continue without user info
      next();
    }
  },
};

module.exports = authMiddleware;
