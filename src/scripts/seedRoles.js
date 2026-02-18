/**
 * Seed Script — Permissions & Roles
 * -----------------------------------
 * Creates section-based permissions and the three system roles
 * (super_admin, admin, moderator) with their assigned permissions.
 *
 * Safe to run multiple times — it upserts, never duplicates.
 *
 * Usage:  node src/scripts/seedRoles.js
 */

const mongoose = require("mongoose");
const config = require("../../config/config");
const Permission = require("../models/permission/Permission");
const Role = require("../models/role/role");
const {
  PERMISSION_SECTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ADMIN_ROLES,
} = require("../constants");

const seed = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to database\n");

    // ── 1. Seed Roles ────────────────────────────────────────
    console.log("Seeding roles...\n");

    // First, create all section permissions for super_admin
    const allSectionPermissions = [];
    for (const section of PERMISSION_SECTIONS) {
      const perm = await Permission.findOneAndUpdate(
        { sectionName: section },
        {
          $set: {
            sectionName: section,
            isSection: true,
            isCreate: true,
            isRead: true,
            isUpdate: true,
            isDelete: true,
          },
        },
        { upsert: true, new: true },
      );
      allSectionPermissions.push(perm._id);
      console.log(`  ✓ Section: ${section}`);
    }

    // Now create roles
    for (const roleName of Object.values(ADMIN_ROLES)) {
      const mapping = DEFAULT_ROLE_PERMISSIONS[roleName];

      let permissionDocs;

      if (mapping === "*") {
        // super_admin gets all section permissions
        permissionDocs = allSectionPermissions;
      } else {
        // Other roles start empty (no permissions)
        permissionDocs = [];
      }

      const description =
        roleName === "super_admin"
          ? "Full system access - can manage all permissions and roles"
          : roleName === "admin"
            ? "Admin role - permissions assigned by super_admin"
            : "Moderator role - permissions assigned by super_admin";

      await Role.findOneAndUpdate(
        { name: roleName },
        {
          $set: {
            name: roleName,
            description,
            permissions: permissionDocs,
            isDefault: true,
          },
        },
        { upsert: true, new: true },
      );

      console.log(
        `  → Role: ${roleName} (${
          permissionDocs.length > 0
            ? `${permissionDocs.length} permissions`
            : "no permissions - assign manually"
        })\n`,
      );
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

seed();
