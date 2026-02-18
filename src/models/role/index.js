const Role = require("./role");

module.exports = {
  // Create a new role
  create: async (data) => {
    const existing = await Role.findOne({ name: data.name.toLowerCase() });
    if (existing) throw new Error(`Role "${data.name}" already exists`);
    return Role.create(data);
  },

  // Get all roles with populated permissions
  getAll: async () => {
    return Role.find().populate("permissions").sort({ createdAt: 1 });
  },

  // Get one by ID with populated permissions
  getById: async (id) => {
    return Role.findById(id).populate("permissions");
  },

  // Get one by name
  getByName: async (name) => {
    return Role.findOne({ name: name.toLowerCase() }).populate("permissions");
  },

  // Update role name / description
  update: async (id, data) => {
    const role = await Role.findById(id);
    if (!role) throw new Error("Role not found");

    if (role.isDefault && data.name && data.name !== role.name) {
      throw new Error("Cannot rename a system-default role");
    }

    Object.assign(role, data);
    await role.save();
    return Role.findById(id).populate("permissions");
  },

  // Delete a role (non-default only)
  delete: async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new Error("Role not found");
    if (role.isDefault) throw new Error("Cannot delete a system-default role");
    return Role.findByIdAndDelete(id);
  },

  // Set the permissions array on a role (replace all)
  setPermissions: async (roleId, permissionIds) => {
    const role = await Role.findById(roleId);
    if (!role) throw new Error("Role not found");
    role.permissions = permissionIds;
    await role.save();
    return Role.findById(roleId).populate("permissions");
  },

  // Add permission IDs to a role (idempotent)
  addPermissions: async (roleId, permissionIds) => {
    const role = await Role.findById(roleId);
    if (!role) throw new Error("Role not found");

    const currentIds = role.permissions.map((id) => id.toString());
    const newIds = permissionIds.filter(
      (id) => !currentIds.includes(id.toString()),
    );

    if (newIds.length > 0) {
      role.permissions.push(...newIds);
      await role.save();
    }

    return Role.findById(roleId).populate("permissions");
  },

  // Remove permission IDs from a role
  removePermissions: async (roleId, permissionIds) => {
    const role = await Role.findById(roleId);
    if (!role) throw new Error("Role not found");

    const removeSet = new Set(permissionIds.map((id) => id.toString()));
    role.permissions = role.permissions.filter(
      (id) => !removeSet.has(id.toString()),
    );

    await role.save();
    return Role.findById(roleId).populate("permissions");
  },
};
