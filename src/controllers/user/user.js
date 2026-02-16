const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const User = require("../../models/user/index");
const { generateToken } = require("../../utils/jwtUtils");
const fileUploader = require("../../utils/fileUploader");

const userController = {
  registerUser: async (req, res, next) => {
    const userData = req.body;
    const { number } = userData;

    try {
      const existingUser = await User.getUserbyNumber(number);
      let newUser = false;
      let user;

      if (!existingUser) {
        const result = await User.createUserWithOTP(userData);
        user = result.user;
        newUser = true;
      } else {
        const result = await User.createUserWithOTP(userData);
        user = result.user;
        newUser = false;
      }
      const responseData = {
        message: "OTP sent to your phone number",
        number: user.number,
        name: user.name,
        expiresAt: user.otp.expiresAt,
        newUser: newUser,
      };

      return APIResponse.send(
        res,
        true,
        201,
        newUser
          ? "Registration initiated. Please verify OTP"
          : "Welcome back! Please verify OTP",
        responseData,
      );
    } catch (error) {
      next(error);
    }
  },

  verifyOTP: async (req, res, next) => {
    const { number, otp } = req.body;

    if (!number || !otp) {
      throw new APIError("Phone number and OTP are required", 400);
    }

    try {
      const user = await User.verifyOTPAndActivateUser(number, otp);

      const token = generateToken({
        userId: user._id,
        number: user.number,
        isVerified: user.isVerified,
      });

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        education: user.education,
        profession: user.profession,
        company: user.company,
        heightCm: user.heightCm,
        languages: user.languages,
        interests: user.interests,
        preferences: user.preferences,
        location: user.location,
        privacy: user.privacy,
        isVerified: user.isVerified,
        profileCompletionPercent: user.profileCompletionPercent,
        createdAt: user.createdAt,
        token: token,
      };

      return APIResponse.send(
        res,
        true,
        200,
        "Registration completed successfully",
        userData,
      );
    } catch (error) {
      next(error);
    }
  },

  resendOTP: async (req, res, next) => {
    const { number } = req.body;

    if (!number) {
      throw new APIError("Phone number is required", 400);
    }

    try {
      await User.resendOTP(number);

      return APIResponse.send(res, true, 200, "OTP resent successfully", {
        number,
        message: "New OTP sent to your phone number",
      });
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    const { id } = req.params;

    try {
      const user = await User.getUserById(id);

      if (!user) {
        throw new APIError("User not found", 404);
      }

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        education: user.education,
        profession: user.profession,
        company: user.company,
        heightCm: user.heightCm,
        languages: user.languages,
        interests: user.interests,
        preferences: user.preferences,
        location: user.location,
        privacy: user.privacy,
        isVerified: user.isVerified,
        profileCompletionPercent: user.profileCompletionPercent,
        createdAt: user.createdAt,
      };

      return APIResponse.send(
        res,
        true,
        200,
        "User retrieved successfully",
        userData,
      );
    } catch (error) {
      next(error);
    }
  },

  updateUser: [
    fileUploader([{ name: "photo", maxCount: 1 }], "profiles"),
    async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;

      try {
        let photoPath = null;

        if (req.files && req.files.photo) {
          const photoFile = req.files.photo[0];
          photoPath = `profiles/${photoFile.filename}`;
        }

        if (photoPath) {
          updateData.profilePhoto = updateData.profilePhoto || [];
          if (Array.isArray(updateData.profilePhoto)) {
            updateData.profilePhoto.push(photoPath);
          } else {
            updateData.profilePhoto = [photoPath];
          }
        }

        const updatedUser = await User.updateUserById(id, updateData);

        const userData = {
          id: updatedUser._id,
          name: updatedUser.name,
          number: updatedUser.number,
          dob: updatedUser.dob,
          gender: updatedUser.gender,
          bio: updatedUser.bio,
          profilePhoto: updatedUser.profilePhoto,
          education: updatedUser.education,
          profession: updatedUser.profession,
          company: updatedUser.company,
          heightCm: updatedUser.heightCm,
          languages: updatedUser.languages,
          interests: updatedUser.interests,
          preferences: updatedUser.preferences,
          location: updatedUser.location,
          privacy: updatedUser.privacy,
          isVerified: updatedUser.isVerified,
          profileCompletionPercent: updatedUser.profileCompletionPercent,
          updatedAt: updatedUser.updatedAt,
        };

        const message = photoPath
          ? "User profile and photo updated successfully"
          : "User updated successfully";

        return APIResponse.send(res, true, 200, message, userData);
      } catch (error) {
        next(error);
      }
    },
  ],
};

module.exports = userController;
