import Board from "../models/Board.js";
import Card from "../models/Card.js";
import List from "../models/List.js";
import Member from "../models/Member.js";
import Organization from "../models/Organization.js";
import Project from "../models/Project.js";
import AppError from "../utils/AppError.js";
import generateSlug from "../utils/helper/generateSlug.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";

/**
 * Reusable helper to verify a user is an active, non-suspended member of an organization
 * and returns their Member document.
 */
async function verifyOrgMember(organizationId, userId, allowedRoles = [], actionName = "perform this action") {
  const member = await Member.findOne({
    organization: organizationId,
    user: userId,
    isDeleted: false,
  });

  if (!member) {
    throw new AppError("You are not a member of this organization", 403);
  }

  if (member.isSuspended) {
    throw new AppError("Your access to this organization has been suspended", 403);
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
    throw new AppError(`Only ${allowedRoles.join(" or ")} can ${actionName}`, 403);
  }

  return member;
}

// POST /api/projects
export async function createProject(req, res) {
  const { name, description, organizationId } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Project name is required", 400);
  }

  if (!organizationId || !isValidObjectId(organizationId)) {
    throw new AppError("Valid organization ID is required", 400);
  }

  // Verify user is owner, admin, or editor of the organization
  await verifyOrgMember(organizationId, req.user._id, ["owner", "admin", "editor"], "create projects");

  const org = await Organization.findOne({ _id: organizationId, isDeleted: false });
  if (!org) {
    throw new AppError("Organization not found", 404);
  }

  // Generate unique slug within the organization
  let slug = generateSlug(name.trim());
  const existing = await Project.findOne({ organization: organizationId, slug, isDeleted: false });
  if (existing) {
    // Append a short random suffix if duplicate slug exists
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const project = await Project.create({
    name: name.trim(),
    description: description ? String(description).trim() : "",
    slug,
    organization: organizationId,
    owner: req.user._id,
    status: "active",
  });

  // Increment totalProjects on Organization
  await Organization.findByIdAndUpdate(organizationId, { $inc: { totalProjects: 1 } });

  const populated = await Project.findById(project._id)
    .populate("owner", "name email avathar")
    .populate("organization", "name slug logo");

  sendResponse(res, 201, "Project created successfully", populated);
}

// GET /api/projects?organizationId=...&isArchived=...&search=...
export async function getProjects(req, res) {
  const { organizationId, isArchived, search } = req.query;

  if (!organizationId || !isValidObjectId(organizationId)) {
    throw new AppError("Valid organization ID query parameter is required", 400);
  }

  // Any active member can view projects
  await verifyOrgMember(organizationId, req.user._id);

  const query = {
    organization: organizationId,
    isDeleted: false,
  };

  if (isArchived === "true") {
    query.isArchived = true;
  } else if (isArchived === "all") {
    // Don't filter isArchived
  } else {
    query.isArchived = false;
  }

  if (search && typeof search === "string" && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const projects = await Project.find(query)
    .populate("owner", "name email avathar")
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, "Projects fetched successfully", projects);
}

// GET /api/projects/:id (by ObjectId or slug)
export async function getProjectById(req, res) {
  const { id } = req.params;
  const { organizationId } = req.query;

  let query;
  if (isValidObjectId(id)) {
    query = { _id: id, isDeleted: false };
  } else if (organizationId && isValidObjectId(organizationId)) {
    query = { slug: id.toLowerCase(), organization: organizationId, isDeleted: false };
  } else {
    query = { slug: id.toLowerCase(), isDeleted: false };
  }

  const project = await Project.findOne(query)
    .populate("owner", "name email avathar")
    .populate("organization", "name slug logo");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Verify member belongs to this project's organization
  await verifyOrgMember(project.organization._id || project.organization, req.user._id);

  sendResponse(res, 200, "Project fetched successfully", project);
}

// PATCH /api/projects/:id
export async function updateProject(req, res) {
  const { id } = req.params;
  const { name, description, status } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid project ID", 400);
  }

  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Verify user is owner, admin, or editor
  await verifyOrgMember(project.organization, req.user._id, ["owner", "admin", "editor"], "update projects");

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      throw new AppError("Project name cannot be empty", 400);
    }
    project.name = trimmed;
    let newSlug = generateSlug(trimmed);
    // Check for slug uniqueness within the organization
    const existingSlug = await Project.findOne({
      organization: project.organization,
      slug: newSlug,
      _id: { $ne: project._id },
      isDeleted: false,
    });
    if (existingSlug) {
      newSlug = `${newSlug}-${Date.now().toString(36).slice(-4)}`;
    }
    project.slug = newSlug;
  }

  if (description !== undefined) {
    project.description = String(description).trim();
  }

  if (status !== undefined) {
    const validStatuses = ["active", "completed", "on-hold", "archived"];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid status value", 400);
    }
    project.status = status;
    if (status === "archived") {
      project.isArchived = true;
    } else if (project.isArchived) {
      project.isArchived = false;
    }
  }

  await project.save();

  const populated = await Project.findById(project._id)
    .populate("owner", "name email avathar")
    .populate("organization", "name slug logo");

  sendResponse(res, 200, "Project updated successfully", populated);
}

// DELETE /api/projects/:id (Soft delete)
export async function deleteProject(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid project ID", 400);
  }

  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner or admin can delete projects
  await verifyOrgMember(project.organization, req.user._id, ["owner", "admin"], "delete projects");

  project.isDeleted = true;
  await project.save();

  // Cascade soft-delete all child resources under this project
  await Board.updateMany({ project: id, isDeleted: false }, { isDeleted: true });
  await List.updateMany({ project: id, isDeleted: false }, { isDeleted: true });
  await Card.updateMany({ project: id, isDeleted: false }, { isDeleted: true });

  // Decrement totalProjects on Organization
  await Organization.findByIdAndUpdate(project.organization, { $inc: { totalProjects: -1 } });

  sendResponse(res, 200, "Project deleted successfully", { id: project._id, isDeleted: true });
}

// PATCH /api/projects/:id/archive (Toggle archive)
export async function toggleArchiveProject(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid project ID", 400);
  }

  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Owner, admin, or editor can archive/unarchive
  await verifyOrgMember(project.organization, req.user._id, ["owner", "admin", "editor"], "archive projects");

  project.isArchived = !project.isArchived;
  project.status = project.isArchived ? "archived" : "active";
  await project.save();

  const actionText = project.isArchived ? "archived" : "restored";
  sendResponse(res, 200, `Project ${actionText} successfully`, project);
}

// GET /api/projects/overview/recent
export async function getRecentProjects(req, res) {
  // Find organizations user belongs to
  const memberships = await Member.find({
    user: req.user._id,
    isDeleted: false,
    isSuspended: false,
  }).select("organization");
  const orgIds = memberships.map((m) => m.organization);

  const accessibleOrgs = await Organization.find({
    $or: [{ owner: req.user._id }, { _id: { $in: orgIds } }],
    isDeleted: false,
  }).select("_id");

  const accessibleOrgIds = accessibleOrgs.map((o) => o._id);

  const recentProjects = await Project.find({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
    isArchived: false,
  })
    .populate("organization", "name slug logo")
    .populate("owner", "name email avathar")
    .sort({ updatedAt: -1 })
    .limit(8);

  sendResponse(res, 200, "Recent projects fetched successfully", recentProjects);
}

// GET /api/projects/overview/stats
export async function getDashboardStats(req, res) {
  const memberships = await Member.find({
    user: req.user._id,
    isDeleted: false,
    isSuspended: false,
  }).select("organization");
  const orgIds = memberships.map((m) => m.organization);

  const orgs = await Organization.find({
    $or: [{ owner: req.user._id }, { _id: { $in: orgIds } }],
    isDeleted: false,
  });

  const accessibleOrgIds = orgs.map((o) => o._id);

  const totalProjects = await Project.countDocuments({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
    isArchived: false,
  });

  const totalMembers = await Member.countDocuments({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
  });

  sendResponse(res, 200, "Dashboard stats fetched successfully", {
    totalOrganizations: orgs.length,
    totalProjects,
    totalTeammates: totalMembers,
  });
}
