const Admin = require("./admin");
const bcryptjs = require("bcryptjs");

module.exports = {
  createAdmin: async (adminData) => {
    const { email, password } = adminData;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new Error("Admin already exists with this email");
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const admin = await Admin.create({
      ...adminData,
      password: hashedPassword,
    });

    const { password: _, ...adminWithoutPassword } = admin.toObject();
    return adminWithoutPassword;
  },

  loginAdmin: async (email, password) => {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      throw new Error("Invalid email or password");
    }

    if (admin.status === "blocked") {
      throw new Error("Account is blocked");
    }

    const isMatch = await bcryptjs.compare(password, admin.password);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const { password: _, ...adminWithoutPassword } = admin.toObject();
    return adminWithoutPassword;
  },

  getAdminById: async (id) => {
    const admin = await Admin.findById(id).select("-password");
    return admin;
  },

  getAdminByEmail: async (email) => {
    const admin = await Admin.findOne({ email });
    return admin;
  },
};
