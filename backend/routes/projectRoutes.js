import express from "express";
import {
  createProject,
  deleteProject,
  getDashboardStats,
  getProjectById,
  getProjects,
  getRecentProjects,
  toggleArchiveProject,
  updateProject,
} from "../controllers/projectController.js";

const projectRoutes = express.Router();

projectRoutes.post("/", createProject);
projectRoutes.get("/", getProjects);
projectRoutes.get("/overview/recent", getRecentProjects);
projectRoutes.get("/overview/stats", getDashboardStats);
projectRoutes.get("/:id", getProjectById);
projectRoutes.patch("/:id", updateProject);
projectRoutes.delete("/:id", deleteProject);
projectRoutes.patch("/:id/archive", toggleArchiveProject);

export default projectRoutes;
