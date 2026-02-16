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
  },
  { timestamps: true },
);

// Index for querying matches by user
MatchSchema.index({ users: 1 });

module.exports = mongoose.model("Match", MatchSchema);
