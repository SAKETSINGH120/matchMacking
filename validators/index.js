const { body, param, query, validationResult } = require("express-validator");
const APIResponse = require("../utils/APIResponse");
const APIError = require("../utils/APIError");

// Validation utility functions
const validationUtils = {
  // Handle validation errors
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      }));

      return APIResponse.validationError(res, errorMessages);
    }
    next();
  },
};

// Sample validation rules for user registration
const userValidation = {
  register: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      ),

    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters and spaces"),

    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters and spaces"),

    validationUtils.handleValidationErrors,
  ],

  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("password").notEmpty().withMessage("Password is required"),

    validationUtils.handleValidationErrors,
  ],
};          

// Sample validation for MongoDB ObjectId parameters
const commonValidation = {
  objectId: [
    param("id").isMongoId().withMessage("Invalid ID format"),

    validationUtils.handleValidationErrors,
  ],

  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),

    query("sort")
      .optional()
      .matches(/^[a-zA-Z_]+$/)
      .withMessage("Sort field can only contain letters and underscores"),

    query("order")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Order must be either asc or desc"),

    validationUtils.handleValidationErrors,
  ],
};

module.exports = {
  validationUtils,
  userValidation,
  commonValidation,
};
