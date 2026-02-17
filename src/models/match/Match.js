const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    compatibilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    matchType: {
      type: String,
      enum: ["swipe", "system"],
      default: "swipe",
    },
    status: {
      type: String,
      enum: ["active", "unmatched", "blocked"],
      default: "active",
    },
    unmatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unmatchedAt: Date,
  },
  { timestamps: true },
);

// Index for querying matches by user
MatchSchema.index({ users: 1 });
MatchSchema.index({ users: 1, status: 1 });

module.exports = mongoose.model("Match", MatchSchema);
