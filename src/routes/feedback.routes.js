const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback/feedback");
const { feedbackValidator } = require("../controllers/feedback/validator");
const { authenticateUser } = require("../middlewares/auth");

// All feedback routes require user authentication
router.use(authenticateUser);

// POST /api/feedback — submit a support ticket
router.post(
  "/",
  feedbackValidator.createTicket,
  feedbackController.createTicket,
);

// GET /api/feedback/my-tickets — view own tickets
router.get("/my-tickets", feedbackController.getMyTickets);

module.exports = router;
