import User from "../models/User.js";
import Project from "../models/Project.js";
import Card from "../models/Card.js";
import Member from "../models/Member.js";
import Organization from "../models/Organization.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sanitizeUser from "../utils/helper/sanitizeUser.js";
import sendResponse from "../utils/sendResponse.js";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function searchUsersByEmail(req, res) {
    const { email } = req.query;
    if (!email) throw new AppError("Email is required", 400);
    const normEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normEmail, isDeleted: false });
    if (!user) throw new AppError("User not found", 404);
    sendResponse(res, 200, "User found", { user: sanitizeUser(user) });
}

// GET /api/search/omni?q=...&organizationId=...
export async function omniSearch(req, res) {
  const { q, organizationId } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    return sendResponse(res, 200, "Search query is empty", {
      projects: [],
      cards: [],
      members: [],
    });
  }

  const safeRegex = new RegExp(escapeRegex(q.trim()), "i");

  // Determine accessible organizations
  let accessibleOrgIds;
  if (organizationId && isValidObjectId(organizationId)) {
    accessibleOrgIds = [organizationId];
  } else {
    const memberships = await Member.find({
      user: req.user._id,
      isDeleted: false,
      isSuspended: false,
    }).select("organization");
    const mOrgIds = memberships.map((m) => m.organization);

    const ownedOrgs = await Organization.find({
      $or: [{ owner: req.user._id }, { _id: { $in: mOrgIds } }],
      isDeleted: false,
    }).select("_id");
    accessibleOrgIds = ownedOrgs.map((o) => o._id);
  }

  // 1. Search Projects
  const projects = await Project.find({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
    $or: [{ name: safeRegex }, { description: safeRegex }],
  })
    .populate("organization", "name slug")
    .limit(10);

  // 2. Search Cards
  const cards = await Card.find({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
    $or: [{ title: safeRegex }, { description: safeRegex }, { "labels.text": safeRegex }],
  })
    .populate("project", "name slug")
    .populate("board", "name")
    .limit(15);

  // 3. Search Members within accessible organizations
  const matchingMembers = await Member.find({
    organization: { $in: accessibleOrgIds },
    isDeleted: false,
  })
    .populate({
      path: "user",
      match: { $or: [{ name: safeRegex }, { email: safeRegex }] },
      select: "name email avathar",
    })
    .limit(10);

  const filteredMembers = matchingMembers.filter((m) => m.user !== null);

  sendResponse(res, 200, "Search results fetched", {
    projects,
    cards,
    members: filteredMembers,
  });
}