const Swipe = require("./Swipe");

module.exports = {
  // Record a swipe from one user to another
  createSwipe: async (fromUser, toUser, action) => {
    const swipe = await Swipe.findOneAndUpdate(
      { fromUser, toUser },
      { action },
      { upsert: true, new: true },
    );
    return swipe;
  },

  // Check if a specific user has already liked the current user
  hasLiked: async (fromUser, toUser) => {
    const swipe = await Swipe.findOne({
      fromUser,
      toUser,
      action: "like",
    }).lean();
    return !!swipe;
  },

  // Get all swipes made by a user
  getSwipesByUser: async (userId) => {
    return Swipe.find({ fromUser: userId })
      .populate("toUser", "name profilePhoto")
      .sort({ createdAt: -1 })
      .lean();
  },
};
