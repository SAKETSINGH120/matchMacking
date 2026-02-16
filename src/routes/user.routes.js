const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/user");
const { userValidator } = require("../controllers/user/validator");
const { validator } = require("../utils/requestParamsValidator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");

router.post(
  "/register",
  userValidator.registerUser,
  userController.registerUser,
);

router.post("/verify-otp", validator.verifyOTP, userController.verifyOTP);
router.post("/resend-otp", validator.resendOTP, userController.resendOTP);

router.get(
  "/:id",
  validator.mongoId("id"),
  asyncHandler(userController.getUserById),
);

router.put(
  "/:id",
  validator.mongoId("id"),
  userValidator.updateUser,
  authenticateUser,
  userController.updateUser,
);

router.delete(
  "/:id",
  validator.mongoId("id"),
  asyncHandler(userController.deleteUser),
);

module.exports = router;
