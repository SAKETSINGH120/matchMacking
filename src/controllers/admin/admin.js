const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const Admin = require("../../models/admin/index");
const { generateToken } = require("../../utils/jwtUtils");

const adminController = {
  signup: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    if (!name || !email || !password) {
      throw new APIError("All fields are required", 400);
    }

    try {
      const admin = await Admin.createAdmin({ name, email, password });

      const token = generateToken({
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      });

      const adminData = {
        ...admin,
        token,
      };

      return APIResponse.send(
        res,
        true,
        201,
        "Admin created successfully",
        adminData,
      );
    } catch (error) {
      throw new APIError(error.message || "Signup failed", 500);
    }
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new APIError("Email and password are required", 400);
    }

    try {
      const admin = await Admin.loginAdmin(email, password);

      const token = generateToken({
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      });

      const adminData = {
        ...admin,
        token,
      };

      return APIResponse.send(res, true, 200, "Login successful", adminData);
    } catch (error) {
      throw new APIError(error.message || "Login failed", 401);
    }
  }),
};

module.exports = adminController;
