const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/user/User");
const APIError = require("../utils/APIError");
const asyncHandler = require("../utils/asyncHandler");
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require("../constants");

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const verifyToken = async (token) => {
  try {
    return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw APIError.unauthorized(MESSAGES.TOKEN_EXPIRED);
    }
    throw APIError.unauthorized(MESSAGES.TOKEN_INVALID);
  }
};

const extractToken = (req) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token && req.headers["x-auth-token"]) {
    token = req.headers["x-auth-token"];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw APIError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const decoded = await verifyToken(token);
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user) {
    throw APIError.unauthorized("User no longer exists");
  }

  if (!user.isActive) {
    throw APIError.forbidden("Account has been deactivated");
  }

  req.user = user;
  req.token = token;

  next();
});

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  await new Promise((resolve, reject) => {
    authenticateUser(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  if (req.user.role !== USER_ROLES.ADMIN) {
    throw APIError.forbidden("Admin access required");
  }

  next();
});

module.exports = {
  authenticateUser,
  authenticateAdmin,
  generateToken,
  verifyToken,
  extractToken,
};
