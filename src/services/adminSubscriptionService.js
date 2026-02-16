const Subscription = require("../models/subscription/Subscription");
const User = require("../models/user/User");

/**
 * Admin Subscription Service
 * Queries and mutations for admin-level subscription management.
 */
const adminSubscriptionService = {
  /**
   * Get paginated subscriptions with optional filters.
   * Supports: status, plan, userId
   */
  getSubscriptions: async ({ status, plan, userId, page = 1, limit = 10 }) => {
    const filter = {};

    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (userId) filter.userId = userId;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("userId", "name number profilePhoto isPremium")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return { subscriptions, total, page, limit };
  },

  /**
   * Get all users with an active subscription (premium users list).
   */
  getPremiumUsers: async ({ page = 1, limit = 10 }) => {
    const [users, total] = await Promise.all([
      User.find({ isPremium: true, status: "active" })
        .select(
          "name number gender profilePhoto isPremium lastActiveAt createdAt",
        )
        .sort({ lastActiveAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments({ isPremium: true, status: "active" }),
    ]);

    return { users, total, page, limit };
  },

  /**
   * Manually activate a subscription for a user (admin override).
   * Useful for gifting premium, compensations, etc.
   */
  activateSubscription: async (userId, { plan, durationDays }) => {
    // Expire any currently active subscription
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "expired" },
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await Subscription.create({
      userId,
      plan,
      price: 0, // Admin-activated, no payment
      paymentId: `admin_${Date.now()}`, // Internal reference
      startDate,
      endDate,
      status: "active",
    });

    await User.findByIdAndUpdate(userId, { isPremium: true });

    return subscription;
  },

  /**
   * Deactivate (expire) a user's active subscription.
   */
  deactivateSubscription: async (userId) => {
    const subscription = await Subscription.findOneAndUpdate(
      { userId, status: "active" },
      { status: "expired" },
      { new: true },
    );

    if (subscription) {
      await User.findByIdAndUpdate(userId, { isPremium: false });
    }

    return subscription;
  },

  /**
   * Cancel a user's active subscription (admin-initiated).
   */
  cancelSubscription: async (userId) => {
    const subscription = await Subscription.findOneAndUpdate(
      { userId, status: "active" },
      { status: "cancelled", cancelledAt: new Date() },
      { new: true },
    );

    if (subscription) {
      await User.findByIdAndUpdate(userId, { isPremium: false });
    }

    return subscription;
  },

  /**
   * Extend the endDate of an active subscription by a number of days.
   */
  extendSubscription: async (userId, extraDays) => {
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) return null;

    // Push the end date forward
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + extraDays);
    subscription.endDate = newEndDate;
    await subscription.save();

    return subscription;
  },

  /**
   * Revenue overview — basic aggregated stats.
   * Returns total revenue, count by plan, and count by status.
   */
  getRevenueOverview: async () => {
    const [revenueByPlan, countByStatus, totalRevenue] = await Promise.all([
      // Revenue and count grouped by plan
      Subscription.aggregate([
        {
          $group: {
            _id: "$plan",
            totalRevenue: { $sum: "$price" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),

      // Count grouped by status
      Subscription.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Overall total revenue
      Subscription.aggregate([
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      byPlan: revenueByPlan.map((p) => ({
        plan: p._id,
        revenue: p.totalRevenue,
        count: p.count,
      })),
      byStatus: countByStatus.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
    };
  },
};

module.exports = adminSubscriptionService;
