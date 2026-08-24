import { getRedisClient } from "../config/reddis.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import generateSlug from "../utils/helper/generateSlug.js";
import sendResponse from "../utils/sendResponse.js";

// Create Organization
export async function createOrganization(req, res) {
  const { name, logo, description } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Organization name is required", 400);
  }
  // Generate slug using org name + user._id
  const slug = generateSlug(name, req.user._id);

  if (!slug) {
    throw new AppError("Invalid organization slug", 400);
  }

  const existingOrg = await Organization.findOne({ slug, owner: req.user._id });
  if (existingOrg && existingOrg.isDeleted === false) {
    throw new AppError("Organization already exists", 400);
  } else if (existingOrg && existingOrg.isDeleted === true) {
    throw new AppError(
      "This organization already exists but was recently deleted. Please restore it before the deletion period ends.",
      400
    );
  }

  const organization = await Organization.create({
    name: name.trim(),
    slug,
    logo: logo || "",
    description: description || "",
    owner: req.user._id,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrganizations: 1 } });

  const redisClient = getRedisClient();
  const key = `user:${req.user._id}`;
  await redisClient.del(key);

  sendResponse(res, 201, "Organization created successfully", organization);
}

// Get organizations for logged-in user (Default isDeleted=false, or isDeleted=true if query param set)
export async function getOrganizations(req, res) {
  const isDeleted = req.query.isDeleted === "true";

  const organizations = await Organization.find({
    owner: req.user._id,
    isDeleted,
  }).sort({ updatedAt: -1 });

  sendResponse(res, 200, "Organizations fetched successfully", organizations);
}

// Get single organization by ID or slug (Public)
export async function getOrganizationById(req, res) {
  const { id } = req.params;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId
    ? { _id: id, isDeleted: false }
    : { slug: id.toLowerCase(), isDeleted: false };

  const organization = await Organization.findOne(query).populate(
    "owner",
    "name avathar"
  );

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  sendResponse(res, 200, "Organization fetched successfully", organization);
}

// Update Organization (Owner only - logo and description updates)
export async function updateOrganization(req, res) {
  const { id } = req.params;
  const { logo, description } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isObjectId) {
    throw new AppError("Invalid organization ID", 400);
  }

  const organization = await Organization.findOne({
    _id: id,
    owner: req.user._id,
    isDeleted: false,
  });

  if (!organization) {
    throw new AppError("Organization not found or unauthorized", 404);
  }

  if (logo !== undefined) {
    organization.logo = logo;
  }

  if (description !== undefined) {
    organization.description = String(description).trim();
  }

  await organization.save();

  sendResponse(res, 200, "Organization updated successfully", organization);
}

// Soft delete organization (Owner only)
export async function deleteOrganization(req, res) {
  const { id } = req.params;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isObjectId) {
    throw new AppError("Invalid organization ID", 400);
  }

  const organization = await Organization.findOne({
    _id: id,
    owner: req.user._id,
    isDeleted: false,
  });

  if (!organization) {
    throw new AppError("Organization not found or unauthorized", 404);
  }

  organization.isDeleted = true;
  organization.isActive = false;
  await organization.save();

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrganizations: -1 } });

  const redisClient = getRedisClient();
  await redisClient.del(`user:${req.user._id}`);

  sendResponse(res, 200, "Organization deleted successfully", {
    id: organization._id,
    isDeleted: true,
  });
}

// Restore soft-deleted organization (Owner only)
export async function restoreOrganization(req, res) {
  const { id } = req.params;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isObjectId) {
    throw new AppError("Invalid organization ID", 400);
  }

  const organization = await Organization.findOne({
    _id: id,
    owner: req.user._id,
    isDeleted: true,
  });

  if (!organization) {
    throw new AppError("Deleted organization not found or unauthorized", 404);
  }

  organization.isDeleted = false;
  organization.isActive = true;
  await organization.save();

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrganizations: 1 } });

  const redisClient = getRedisClient();
  await redisClient.del(`user:${req.user._id}`);

  sendResponse(res, 200, "Organization restored successfully", organization);
}
