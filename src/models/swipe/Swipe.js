const mongoose = require("mongoose");

const SwipeSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  { timestamps: true },
);

// Ensure a user can only swipe once on another user
SwipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

// Index for quick lookups when checking mutual likes
SwipeSchema.index({ toUser: 1, fromUser: 1, action: 1 });

module.exports = mongoose.model("Swipe", SwipeSchema);
