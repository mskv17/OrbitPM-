import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizations,
  restoreOrganization,
  updateOrganization,
} from "../controllers/organizationController.js";
import { authMidleWare } from "../middleware/authmiddleware.js";

const organizationRoutes = express.Router();

// Protected routes (Requires Authentication)
organizationRoutes.post("/", authMidleWare, createOrganization);
organizationRoutes.get("/", authMidleWare, getOrganizations);
organizationRoutes.patch("/:id/restore", authMidleWare, restoreOrganization);
organizationRoutes.patch("/:id", authMidleWare, updateOrganization);
organizationRoutes.delete("/:id", authMidleWare, deleteOrganization);

// Public route (Get Organization by ID or Slug)
organizationRoutes.get("/:id", getOrganizationById);

export default organizationRoutes;
