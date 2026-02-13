const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Sample User model to demonstrate the recommended structure
// This shows best practices for Mongoose schemas
const userSchema = new mongoose.Schema(
  {
    // Basic user information
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          // Basic email validation
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // Profile information
    profile: {
      avatar: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      dateOfBirth: {
        type: Date,
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: function (phone) {
            // Basic phone validation (optional field)
            return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
          },
          message: "Please provide a valid phone number",
        },
      },
    },

    // Status and permissions
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Security fields
    lastLoginAt: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },

    // Account management
    accountCreatedAt: {
      type: Date,
      default: Date.now,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt
    versionKey: false, // Remove the __v field
    toJSON: {
      virtuals: true, // Include virtual fields when converting to JSON
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  // Set passwordChangedAt to current time minus 1 second
  // This ensures the token is created after the password is changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }

  // Password was never changed
  return false;
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true, deletedAt: null });
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model("User", userSchema);
