const Permission = require("./Permission");

module.exports = {
  // Create a new section permission
  create: async (data) => {
    return Permission.create(data);
  },

  // Get all permissions
  getAll: async () => {
    return Permission.find().sort({ sectionName: 1 });
  },

  // Get one by ID
  getById: async (id) => {
    return Permission.findById(id);
  },

  // Update a permission (toggle CRUD flags, rename section, etc.)
  update: async (id, data) => {
    const permission = await Permission.findById(id);
    if (!permission) throw new Error("Permission not found");
    Object.assign(permission, data);
    return permission.save();
  },

  // Delete a permission and remove it from all roles
  delete: async (id) => {
    const permission = await Permission.findById(id);
    if (!permission) throw new Error("Permission not found");

    const Role = require("../role/role");
    await Role.updateMany({ permissions: id }, { $pull: { permissions: id } });

    return Permission.findByIdAndDelete(id);
  },
};
