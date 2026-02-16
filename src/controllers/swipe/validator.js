const { body } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const swipeValidator = {
  // Validate swipe request body
  handleSwipe: withErrorHandling([
    body("toUser")
      .notEmpty()
      .withMessage("Target user ID is required")
      .isMongoId()
      .withMessage("Invalid target user ID format"),

    body("action")
      .notEmpty()
      .withMessage("Swipe action is required")
      .isIn(["like", "dislike"])
      .withMessage("Action must be either 'like' or 'dislike'"),
  ]),
};

module.exports = { swipeValidator };
