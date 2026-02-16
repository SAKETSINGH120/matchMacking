const User = require("../models/user/User");
const Admin = require("../models/admin/admin");
const APIError = require("../utils/APIError");
const asyncHandler = require("../utils/asyncHandler");
const { MESSAGES } = require("../constants");
const { verifyToken } = require("../utils/jwtUtils");

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
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw APIError.unauthorized("User no longer exists");
  }

  if (user.status !== "active") {
    throw APIError.forbidden("Account has been deactivated");
  }

  req.user = user;
  req.token = token;

  next();
});

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw APIError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const decoded = await verifyToken(token);
  const admin = await Admin.findById(decoded.adminId || decoded.userId);

  if (!admin) {
    throw APIError.unauthorized("Admin no longer exists");
  }

  if (admin.status !== "active") {
    throw APIError.forbidden("Admin account has been blocked");
  }

  if (admin.role !== "admin") {
    throw APIError.forbidden("Admin access required");
  }

  req.admin = admin;
  req.token = token;

  next();
});

module.exports = {
  authenticateUser,
  authenticateAdmin,
  verifyToken,
  extractToken,
};
