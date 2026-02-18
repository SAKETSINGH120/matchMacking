const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const RoleService = require("../../models/role/index");
const PermissionService = require("../../models/permission/index");

const adminRoleController = {
  // GET /admin/roles — list all roles
  getAll: asyncHandler(async (req, res) => {
    const roles = await RoleService.getAll();
    return APIResponse.send(res, true, 200, "Roles fetched", roles);
  }),

  // GET /admin/roles/:id — get one role with permissions
  getById: asyncHandler(async (req, res) => {
    const role = await RoleService.getById(req.params.id);
    if (!role) throw APIError.notFound("Role not found");
    return APIResponse.send(res, true, 200, "Role fetched", role);
  }),

  // POST /admin/roles — create a new role
  // Body: { name, description, permissions: ["permissionId1", ...] }
  create: asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;

    if (!name) throw APIError.badRequest("Role name is required");

    // Validate permission IDs if provided
    if (permissions && permissions.length > 0) {
      for (const id of permissions) {
        const exists = await PermissionService.getById(id);
        if (!exists) {
          throw APIError.badRequest(`Permission ID "${id}" not found`);
        }
      }
    }

    const role = await RoleService.create({
      name,
      description,
      permissions: permissions || [],
    });

    // Return with populated permissions
    const populated = await RoleService.getById(role._id);
    return APIResponse.send(res, true, 201, "Role created", populated);
  }),

  // PUT /admin/roles/:id — update role name/description
  // (use the assign/remove endpoints below for permissions)
  update: asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const role = await RoleService.update(req.params.id, { name, description });
    return APIResponse.send(res, true, 200, "Role updated", role);
  }),

  // DELETE /admin/roles/:id — delete a custom role
  delete: asyncHandler(async (req, res) => {
    await RoleService.delete(req.params.id);
    return APIResponse.send(res, true, 200, "Role deleted");
  }),

  // ── Assign / Remove permissions on a role ────────────────

  // PATCH /admin/roles/:id/permissions — assign permissions to a role
  // Body: { permissions: ["id1", "id2"], action: "add"|"set" }
  // action: "add" (default) = add to existing, "set" = replace all
  assignPermissions: asyncHandler(async (req, res) => {
    const { permissions, action = "add" } = req.body;

    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      throw APIError.badRequest("Provide an array of permission IDs");
    }

    // Validate each ID exists
    for (const id of permissions) {
      const exists = await PermissionService.getById(id);
      if (!exists) {
        throw APIError.badRequest(`Permission ID "${id}" not found`);
      }
    }

    let role;
    if (action === "set") {
      // Replace all permissions
      role = await RoleService.setPermissions(req.params.id, permissions);
    } else {
      // Add to existing permissions
      role = await RoleService.addPermissions(req.params.id, permissions);
    }

    const message =
      action === "set"
        ? "Role permissions updated"
        : "Permissions assigned to role";
    return APIResponse.send(res, true, 200, message, role);
  }),

  // DELETE /admin/roles/:id/permissions — remove permissions from a role
  // Body: { permissions: ["permissionId1"] }
  removePermissions: asyncHandler(async (req, res) => {
    const { permissions } = req.body;

    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      throw APIError.badRequest("Provide an array of permission IDs to remove");
    }

    const role = await RoleService.removePermissions(
      req.params.id,
      permissions,
    );
    return APIResponse.send(
      res,
      true,
      200,
      "Permissions removed from role",
      role,
    );
  }),
};

module.exports = adminRoleController;
