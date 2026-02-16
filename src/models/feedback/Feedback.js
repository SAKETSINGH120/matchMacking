const mongoose = require("mongoose");

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const TICKET_CATEGORIES = [
  "bug",
  "account_issue",
  "payment",
  "safety",
  "feature_request",
  "other",
];

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "open",
    },
    // Admin's reply when responding to the ticket
    adminReply: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Quick lookups by status and user
FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
