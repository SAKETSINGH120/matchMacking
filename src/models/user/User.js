const mongoose = require("mongoose");

const UserModelSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    number: { type: String, unique: true },
    dob: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    primaryImage: { type: String },
    secondaryImages: [String],
    education: String,
    profession: String,
    company: String,
    heightCm: Number,
    languages: [String],
    isVerified: {
      type: Boolean,
      default: false,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    lifestyle: {
      drinking: {
        type: String,
        enum: ["never", "rarely", "socially", "regularly"],
      },
      smoking: {
        type: String,
        enum: ["never", "occasionally", "regularly"],
      },
      workout: {
        type: String,
        enum: ["never", "sometimes", "often", "daily"],
      },
      diet: {
        type: String,
        enum: ["veg", "non-veg", "vegan", "no-preference"],
      },
    },
    relationshipGoal: {
      type: String,
      enum: ["casual", "serious", "friendship", "marriage"],
    },
    preferences: {
      interestedIn: {
        type: String,
        enum: ["male", "female", "everyone"],
      },
      minAge: Number,
      maxAge: Number,
      maxDistanceKm: {
        type: Number,
        default: 50,
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      city: String,
      country: String,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "deleted"],
      default: "active",
    },
    privacy: {
      showAge: { type: Boolean, default: true },
      showDistance: { type: Boolean, default: true },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    profileCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    activityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastActiveAt: Date,
    otp: {
      code: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 },
      verified: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserModelSchema);
