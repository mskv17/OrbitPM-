import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizationMembers,
  getOrganizations,
  inviteMember,
  removeMember,
  restoreOrganization,
  toggleMemberSuspend,
  updateMemberRole,
  updateOrganization,
} from "../controllers/organizationController.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const organizationRoutes = express.Router();

// Protected routes (Requires Authentication)
organizationRoutes.post("/", createOrganization);
organizationRoutes.get("/", getOrganizations);
organizationRoutes.post("/invite/member", roleMiddleware(["owner", "admin"], "invite new members"), inviteMember);
organizationRoutes.patch("/:id/restore", restoreOrganization);
organizationRoutes.patch("/:id", updateOrganization);
organizationRoutes.delete("/:id", deleteOrganization);

// (Get Organization by ID or Slug)
organizationRoutes.get("/members/:id", getOrganizationMembers);
organizationRoutes.get("/:id", getOrganizationById);

// Update member role (owner and admin only; fine-grained checks in controller)
organizationRoutes.patch(
  "/members/:organizationId/:memberId/role",
  roleMiddleware(["owner", "admin"], "change member roles"),
  updateMemberRole
);

// Suspend or unsuspend member (owner and admin only; fine-grained checks in controller)
organizationRoutes.patch(
  "/members/:organizationId/:memberId/suspend",
  roleMiddleware(["owner", "admin"], "suspend members"),
  toggleMemberSuspend
);

// Remove a member OR leave an organization
// All roles can hit this endpoint; fine-grained checks live in the controller
organizationRoutes.delete(
  "/members/:organizationId/:memberId",
  roleMiddleware(["owner", "admin", "editor", "viewer"], "remove or leave members"),
  removeMember
);

export default organizationRoutes;
