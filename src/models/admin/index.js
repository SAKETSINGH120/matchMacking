const Admin = require("./admin");
const Role = require("../role/role");
const bcryptjs = require("bcryptjs");

// Helper: populate role and its permissions
const populateRole = (query) =>
  query.populate({
    path: "role",
    populate: { path: "permissions" },
  });

module.exports = {
  createAdmin: async (adminData) => {
    const { email, password, role: roleName } = adminData;
    console.log("🚀 ~ roleName:", roleName);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new Error("Admin already exists with this email");
    }

    // Resolve role by name — default to "admin"
    const roleDoc = await Role.findOne({
      name: (roleName || "admin").toLowerCase(),
    });
    if (!roleDoc) {
      throw new Error(
        `Role "${roleName || "admin"}" not found. Run the seed script first.`,
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    let admin = await Admin.create({
      ...adminData,
      role: roleDoc._id,
      password: hashedPassword,
    });

    // Populate role + permissions for the response
    admin = await populateRole(Admin.findById(admin._id).select("-password"));

    return admin.toObject();
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

    // Re-fetch with role populated
    const populated = await populateRole(
      Admin.findById(admin._id).select("-password"),
    );

    return populated.toObject();
  },

  getAdminById: async (id) => {
    return populateRole(Admin.findById(id).select("-password"));
  },

  getAdminByEmail: async (email) => {
    return populateRole(Admin.findOne({ email }));
  },
};
