const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const PermissionService = require("../../models/permission/index");

const adminPermissionController = {
  // GET /admin/permissions — list all permissions
  getAll: asyncHandler(async (req, res) => {
    const permissions = await PermissionService.getAll();
    return APIResponse.send(res, true, 200, "Permissions fetched", permissions);
  }),

  // GET /admin/permissions/:id — get one permission
  getById: asyncHandler(async (req, res) => {
    const permission = await PermissionService.getById(req.params.id);
    if (!permission) throw APIError.notFound("Permission not found");
    return APIResponse.send(res, true, 200, "Permission fetched", permission);
  }),

  // POST /admin/permissions — create a section permission
  // Body: { sectionName, isSection, isCreate, isRead, isUpdate, isDelete }
  create: asyncHandler(async (req, res) => {
    const { sectionName } = req.body;

    if (!sectionName) {
      throw APIError.badRequest("sectionName is required");
    }

    const permission = await PermissionService.create(req.body);
    return APIResponse.send(
      res,
      true,
      201,
      "Permission created and automatically assigned to super_admin",
      permission,
    );
  }),

  // PUT /admin/permissions/:id — update a permission
  update: asyncHandler(async (req, res) => {
    const permission = await PermissionService.update(req.params.id, req.body);
    return APIResponse.send(res, true, 200, "Permission updated", permission);
  }),

  // DELETE /admin/permissions/:id — delete a permission
  delete: asyncHandler(async (req, res) => {
    await PermissionService.delete(req.params.id);
    return APIResponse.send(res, true, 200, "Permission deleted");
  }),
};

module.exports = adminPermissionController;
