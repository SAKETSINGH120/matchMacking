const User = require("./User");

module.exports = {
  // Create or update user with OTP
  createUserWithOTP: async (userData) => {
    const { number } = userData;
    const otp = "1234"; // Math.floor(100000 + Math.random() * 9000).toString();

    const user = await User.findOneAndUpdate(
      { number },
      {
        ...userData,
        otp: {
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          attempts: 0,
          verified: false,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`OTP for ${number}: ${otp}`);
    return { user, otp };
  },

  // Verify OTP and activate user
  verifyOTPAndActivateUser: async (number, otpCode) => {
    const user = await User.findOne({ number });

    if (!user || !user.otp) {
      throw new Error("User not found or OTP not generated");
    }

    if (new Date() > user.otp.expiresAt) {
      throw new Error("OTP has expired");
    }

    if (user.otp.attempts >= 3) {
      throw new Error("Maximum OTP attempts exceeded");
    }

    if (user.otp.code !== otpCode) {
      user.otp.attempts += 1;
      await user.save();
      throw new Error(
        `Invalid OTP. ${3 - user.otp.attempts} attempts remaining`,
      );
    }

    user.otp.verified = true;
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    return user;
  },

  // Get user by number
  getUserbyNumber: async (number) => {
    const user = await User.findOne({ number });
    return user;
  },

  // Resend OTP
  resendOTP: async (number) => {
    const user = await User.findOne({ number });

    if (!user) {
      throw new Error("User not found");
    }

    // Check rate limit (1 minute)
    if (user.otp && user.otp.expiresAt) {
      const timeDiff =
        Date.now() - (user.otp.expiresAt.getTime() - 10 * 60 * 1000);
      if (timeDiff < 60000) {
        const remainingTime = Math.ceil((60000 - timeDiff) / 1000);
        throw new Error(
          `Please wait ${remainingTime} seconds before requesting new OTP`,
        );
      }
    }

    const otp = "1234"; //Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false,
    };

    await user.save();
    console.log(`Resend OTP for ${number}: ${otp}`);
    return otp;
  },
  // Update user by ID
  updateUserById: async (id, updateData) => {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isVerified) {
      throw new Error("User must be verified to update profile");
    }

    // Fields that cannot be updated
    const protectedFields = [
      "number",
      "isVerified",
      "otp",
      "_id",
      "createdAt",
      "updatedAt",
    ];

    // Remove protected fields from update data
    const filteredUpdateData = { ...updateData };
    protectedFields.forEach((field) => delete filteredUpdateData[field]);

    // Pull out secondaryImagePaths — these go into $push, not $set
    const secondaryImagePaths = filteredUpdateData.secondaryImagePaths || [];
    delete filteredUpdateData.secondaryImagePaths;

    // Build update operation
    const updateOp = { $set: filteredUpdateData };
    if (secondaryImagePaths.length > 0) {
      updateOp.$push = { secondaryImages: { $each: secondaryImagePaths } };
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateOp, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  },

  // Upload profile photo
  uploadProfilePhoto: async (userId, photoPath) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isVerified) {
      throw new Error("User must be verified to upload photos");
    }

    // Set primary image and push into secondaryImages array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { primaryImage: photoPath },
        $push: { secondaryImages: photoPath },
      },
      { new: true, runValidators: true },
    );

    return updatedUser;
  },

  // Get user by ID (excluding sensitive fields)
  getUserById: async (id) => {
    const user = await User.findById(id).select("-otp -__v");
    return user;
  },
};
