const { body } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const feedbackValidator = {
  createTicket: withErrorHandling([
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isIn(["bug", "account_issue", "payment", "safety", "feature_request", "other"])
      .withMessage(
        "Category must be bug, account_issue, payment, safety, feature_request, or other",
      ),

    body("subject")
      .notEmpty()
      .withMessage("Subject is required")
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("Subject must be between 3 and 200 characters"),

    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters"),
  ]),
};

module.exports = { feedbackValidator };
