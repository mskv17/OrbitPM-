import { getRedisClient } from "../config/reddis.js";
import Board from "../models/Board.js";
import Card from "../models/Card.js";
import Comment from "../models/Comment.js";
import Invitation from "../models/Invitation.js";
import List from "../models/List.js";
import Member from "../models/Member.js";
import Organization from "../models/Organization.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { sendInvitationEmail } from "../services/emailService.js";
import AppError from "../utils/AppError.js";
import { genResetToken } from "../utils/generateTokens.js";
import generateSlug from "../utils/helper/generateSlug.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sanitizeUser from "../utils/helper/sanitizeUser.js";
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

  await Member.create({
    organization: organization._id,
    user: req.user._id,
    role: "owner",
    title: "Founder",
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

  let query;
  if (isDeleted) {
    // Only owner can see/restore deleted organizations
    query = { owner: req.user._id, isDeleted: true };
  } else {
    // Find all orgs where user is owner or an active non-suspended member
    const memberships = await Member.find({
      user: req.user._id,
      isDeleted: false,
      isSuspended: false,
    }).select("organization");

    const orgIds = memberships.map((m) => m.organization);

    query = {
      $or: [{ owner: req.user._id }, { _id: { $in: orgIds } }],
      isDeleted: false,
    };
  }

  const organizations = await Organization.find(query)
    .populate("owner", "name email avathar")
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, "Organizations fetched successfully", organizations);
}

// Get single organization by ID or slug 
export async function getOrganizationById(req, res) {
  const { id } = req.params;

  const isObjectId = isValidObjectId(id);
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

  // Verify the requesting user is a member of this organization
  await resolveMember(organization._id, req.user._id, "You");

  sendResponse(res, 200, "Organization fetched successfully", organization);
}

// Update Organization (Owner only - logo and description updates)
export async function updateOrganization(req, res) {
  const { id } = req.params;
  const { logo, description } = req.body;

  const isObjectId = isValidObjectId(id);
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

// Soft delete organization (Owner only) — cascades to all child resources
export async function deleteOrganization(req, res) {
  const { id } = req.params;

  const isObjectId = isValidObjectId(id);
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

  // Cascade soft-delete all child resources
  await Project.updateMany({ organization: id, isDeleted: false }, { isDeleted: true });
  await Board.updateMany({ organization: id, isDeleted: false }, { isDeleted: true });
  await List.updateMany({ organization: id, isDeleted: false }, { isDeleted: true });
  await Card.updateMany({ organization: id, isDeleted: false }, { isDeleted: true });
  await Comment.updateMany(
    { card: { $in: await Card.find({ organization: id }).distinct("_id") }, isDeleted: false },
    { isDeleted: true }
  ).catch(() => {}); // best-effort for comments
  await Member.updateMany({ organization: id, isDeleted: false }, { isDeleted: true });

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

  const isObjectId = isValidObjectId(id);
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

// Get Organization members by Organization ID
export async function getOrganizationMembers(req, res) {
  const { id } = req.params;

  const isObjectId = isValidObjectId(id);
  if (!isObjectId) {
    throw new AppError("Invalid organization ID", 400);
  }

  const organization = await Organization.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  // Verify the requesting user is a member of this organization
  await resolveMember(id, req.user._id, "You");

  const members = await Member.find({
    organization: id,
    isDeleted: false,
  }).populate("user", "name email avathar");

  sendResponse(res, 200, "Organization members fetched successfully", members);
}

export async function inviteMember(req, res) {

  const { organizationId, memberId, role } = req.body;
  const currentMember = req.currentMember;

  const isObjectId = isValidObjectId(memberId);
  if (!isObjectId) {
    throw new AppError("Invalid member ID", 400);
  }

  const user = await User.findOne({ _id: memberId, isDeleted: false });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const existingMember = await Member.findOne({
    organization: organizationId,
    user: memberId,
    isDeleted: false,
  });

  if (existingMember) {
    throw new AppError("Member already exists in the organization", 400);
  }

  const existingInvitation = await Invitation.findOne({
    organization: organizationId,
    to: memberId,
    status: "pending",
  });

  if (existingInvitation) {
    throw new AppError("Invitation already sent to this user", 400);
  }

  const { hash, resetToken } = genResetToken();

  await Invitation.create({
    to: memberId,
    from: currentMember._id,
    organization: organizationId,
    role: role,
    token: hash,
    status: "pending",
  });

  await sendInvitationEmail(user.email, resetToken);

  sendResponse(res, 201, "Invitation sent successfully, Inform the user to check email", {
    requestedUser: sanitizeUser(user),
  });
}

// ─── Reusable helpers ────────────────────────────────────────────────────────

/**
 * Resolves and returns the active Member document for a given user inside an org.
 * Throws AppError if not found or soft-deleted.
 */
async function resolveMember(organizationId, userId, label = "Member") {
  const member = await Member.findOne({
    organization: organizationId,
    user: userId,
    isDeleted: false,
  });
  if (!member) {
    throw new AppError(`${label} not found in this organization`, 404);
  }
  return member;
}

/**
 * Invalidates the Redis cache entry for a member's role look-up.
 * Call after any membership change so roleMiddleware re-fetches fresh data.
 */
async function invalidateMemberCache(userId, organizationId) {
  const redisClient = getRedisClient();
  await redisClient.del(`memeber:${userId}:${organizationId}`);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /organizations/members/:organizationId/:memberId
 *
 * Permission matrix
 * ─────────────────
 * owner  → can remove any member EXCEPT themselves (owner cannot self-remove)
 * admin  → can remove editor / viewer only; cannot remove other admins or owner
 *          EXCEPTION: admin CAN remove themselves (leave)
 * editor → can only leave (remove themselves); cannot remove others
 * viewer → can only leave (remove themselves); cannot remove others
 */
export async function removeMember(req, res) {
  const { organizationId, memberId } = req.params;
  const currentMember = req.currentMember; // set by roleMiddleware
  const actorRole = currentMember.role;

  // Validate memberId param
  if (!isValidObjectId(memberId)) {
    throw new AppError("Invalid member ID", 400);
  }

  const isSelfAction = String(currentMember.user) === String(memberId);

  // Resolve the target member record
  const targetMember = await resolveMember(organizationId, memberId, "Target member");
  const targetRole = targetMember.role;

  // ── owner ──────────────────────────────────────────────────────────────────
  if (actorRole === "owner") {
    if (isSelfAction) {
      throw new AppError(
        "Owner cannot remove themselves. Transfer ownership first.",
        403
      );
    }
    // Owner can remove anyone else — no further restriction
  }

  // ── admin ──────────────────────────────────────────────────────────────────
  else if (actorRole === "admin") {
    if (!isSelfAction) {
      // Admin can only remove editor or viewer
      if (targetRole === "owner" || targetRole === "admin") {
        throw new AppError(
          `Admin cannot remove a${targetRole === "owner" ? "n" : "nother"} ${targetRole}.`,
          403
        );
      }
    }
    // Leaving (self-removal) is always allowed for admin
  }

  // ── editor / viewer ────────────────────────────────────────────────────────
  else {
    if (!isSelfAction) {
      throw new AppError(
        `${actorRole.charAt(0).toUpperCase() + actorRole.slice(1)}s can only leave the organization, not remove other members.`,
        403
      );
    }
    // Self-removal (leave) is allowed
  }

  // ── Perform removal ────────────────────────────────────────────────────────
  targetMember.isDeleted = true;
  await targetMember.save();

  // Update counters: decrement totalTeamMembers on Organization, totalMemberShips on User
  await Organization.findByIdAndUpdate(organizationId, { $inc: { totalTeamMembers: -1 } });
  await User.findByIdAndUpdate(memberId, { $inc: { totalMemberShips: -1 } });

  // Bust Redis cache so stale role data is not served
  await invalidateMemberCache(memberId, organizationId);

  const message = isSelfAction
    ? "You have successfully left the organization."
    : "Member removed successfully.";

  sendResponse(res, 200, message, { memberId, organizationId });
}

/**
 * PATCH /organizations/members/:organizationId/:memberId/role
 * Body: { role: "admin" | "editor" | "viewer" }
 */
export async function updateMemberRole(req, res) {
  const { organizationId, memberId } = req.params;
  const { role } = req.body;
  const currentMember = req.currentMember;
  const actorRole = currentMember.role;

  if (!isValidObjectId(memberId)) {
    throw new AppError("Invalid member ID", 400);
  }

  const validRoles = ["admin", "editor", "viewer"];
  if (!role || !validRoles.includes(role)) {
    throw new AppError("Invalid role. Must be admin, editor, or viewer", 400);
  }

  const isSelf = String(currentMember.user) === String(memberId);
  if (isSelf) {
    throw new AppError("You cannot change your own role", 400);
  }

  const targetMember = await resolveMember(organizationId, memberId, "Target member");
  const targetRole = targetMember.role;

  if (targetRole === "owner") {
    throw new AppError("Owner role cannot be changed", 403);
  }

  if (actorRole === "owner") {
    // Owner can assign any valid role
    targetMember.role = role;
  } else if (actorRole === "admin") {
    if (targetRole === "admin") {
      throw new AppError("Admin cannot change another admin's role", 403);
    }
    if (role === "admin") {
      throw new AppError("Only the organization owner can promote members to admin", 403);
    }
    targetMember.role = role;
  } else {
    throw new AppError("You do not have permission to change member roles", 403);
  }

  await targetMember.save();
  await invalidateMemberCache(memberId, organizationId);

  const populated = await Member.findById(targetMember._id).populate("user", "name email avathar");

  sendResponse(res, 200, "Member role updated successfully", populated);
}

/**
 * PATCH /organizations/members/:organizationId/:memberId/suspend
 */
export async function toggleMemberSuspend(req, res) {
  const { organizationId, memberId } = req.params;
  const currentMember = req.currentMember;
  const actorRole = currentMember.role;

  if (!isValidObjectId(memberId)) {
    throw new AppError("Invalid member ID", 400);
  }

  const isSelf = String(currentMember.user) === String(memberId);
  if (isSelf) {
    throw new AppError("You cannot suspend yourself", 400);
  }

  const targetMember = await resolveMember(organizationId, memberId, "Target member");
  const targetRole = targetMember.role;

  if (targetRole === "owner") {
    throw new AppError("Owner cannot be suspended", 403);
  }

  if (actorRole === "owner") {
    targetMember.isSuspended = !targetMember.isSuspended;
  } else if (actorRole === "admin") {
    if (targetRole === "admin") {
      throw new AppError("Admin cannot suspend another admin", 403);
    }
    targetMember.isSuspended = !targetMember.isSuspended;
  } else {
    throw new AppError("You do not have permission to suspend members", 403);
  }

  await targetMember.save();
  await invalidateMemberCache(memberId, organizationId);

  const actionText = targetMember.isSuspended ? "suspended" : "unsuspended";
  sendResponse(res, 200, `Member ${actionText} successfully`, {
    memberId,
    isSuspended: targetMember.isSuspended,
  });
}