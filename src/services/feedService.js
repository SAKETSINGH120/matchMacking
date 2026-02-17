const User = require("../models/user/User");
const Swipe = require("../models/swipe/Swipe");
const mongoose = require("mongoose");
const compatibilityService = require("./compatibilityService");

/**
 * Feed Service
 * Builds the aggregation pipeline to fetch suggested users for the feed.
 * Excludes already-swiped users, applies gender & age preferences,
 * location proximity, and ranks results by compatibility score.
 */
const feedService = {
  /**
   * Get suggested users for a given user
   * @param {Object} currentUser - The authenticated user document
   * @param {Object} options - { page, limit }
   * @returns {Object} { users, total, page, limit }
   */
  getSuggestedUsers: async (currentUser, { page = 1, limit = 10 }) => {
    const userId = currentUser._id;

    // ---- 1. Collect IDs the user has already swiped on ----
    const swipedUserIds = await Swipe.distinct("toUser", { fromUser: userId });

    // IDs to exclude from results (self + already swiped)
    const excludeIds = [userId, ...swipedUserIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // ---- 2. Build match filters ----
    const matchFilters = {
      _id: { $nin: excludeIds },
      status: "active",
    };

    // Gender preference filter
    const interestedIn = currentUser.preferences?.interestedIn;
    if (interestedIn && interestedIn !== "everyone") {
      matchFilters.gender = interestedIn;
    }

    // Age preference filter (convert min/max age to DOB range)
    const minAge = currentUser.preferences?.minAge;
    const maxAge = currentUser.preferences?.maxAge;

    if (minAge || maxAge) {
      matchFilters.dob = {};
      const now = new Date();

      if (maxAge) {
        // Oldest DOB allowed (e.g. maxAge 30 → born at least 30 years ago)
        const oldestDob = new Date(now);
        oldestDob.setFullYear(oldestDob.getFullYear() - maxAge - 1);
        matchFilters.dob.$gte = oldestDob;
      }

      if (minAge) {
        // Youngest DOB allowed (e.g. minAge 20 → born at most 20 years ago)
        const youngestDob = new Date(now);
        youngestDob.setFullYear(youngestDob.getFullYear() - minAge);
        matchFilters.dob.$lte = youngestDob;
      }
    }

    // ---- 3. Build aggregation pipeline ----
    const pipeline = [];

    // If current user has location, use $geoNear as the first stage
    const hasLocation =
      currentUser.location?.coordinates?.length === 2 &&
      currentUser.location.coordinates[0] !== 0;

    const maxDistanceKm = currentUser.preferences?.maxDistanceKm || 50;

    if (hasLocation) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: currentUser.location.coordinates,
          },
          distanceField: "distanceMeters",
          maxDistance: maxDistanceKm * 1000, // convert km → meters
          spherical: true,
          query: matchFilters,
        },
      });
    } else {
      // No location available — fall back to a simple $match
      pipeline.push({ $match: matchFilters });
    }

    // Sort by last active (most recently active first), then by createdAt
    pipeline.push({
      $sort: { lastActiveAt: -1, createdAt: -1 },
    });

    // Fetch a larger candidate pool for scoring (up to 200 per page batch)
    const candidateLimit = Math.min(limit * 5, 200);

    pipeline.push({
      $limit: candidateLimit,
    });

    // Project all fields needed for compatibility scoring
    pipeline.push({
      $project: {
        name: 1,
        gender: 1,
        dob: 1,
        bio: 1,
        profilePhoto: 1,
        education: 1,
        profession: 1,
        company: 1,
        heightCm: 1,
        languages: 1,
        interests: 1,
        isVerified: 1,
        "location.city": 1,
        "location.country": 1,
        "location.coordinates": 1,
        lifestyle: 1,
        relationshipGoal: 1,
        lastActiveAt: 1,
        activityScore: 1,
        distanceMeters: 1,
      },
    });

    const candidates = await User.aggregate(pipeline);

    // ---- 4. Score each candidate using the compatibility service ----
    const scored = candidates.map((candidate) => {
      const distanceKm =
        candidate.distanceMeters !== undefined
          ? candidate.distanceMeters / 1000
          : null;

      const compatibilityScore = compatibilityService.calculateScore(
        currentUser,
        candidate,
        distanceKm,
      );

      // Convert distance for response
      if (candidate.distanceMeters !== undefined) {
        candidate.distanceKm = Math.round(candidate.distanceMeters / 1000);
        delete candidate.distanceMeters;
      }

      // Remove raw fields not needed in response
      delete candidate.location?.coordinates;
      delete candidate.lifestyle;
      delete candidate.activityScore;

      return { ...candidate, compatibilityScore };
    });

    // ---- 5. Sort by compatibility score (descending) ----
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // ---- 6. Paginate the scored results ----
    const total = scored.length;
    const skip = (page - 1) * limit;
    const users = scored.slice(skip, skip + limit);

    return { users, total, page, limit };
  },
};

module.exports = feedService;
