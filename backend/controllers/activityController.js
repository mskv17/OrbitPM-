import Activity from "../models/Activity.js";
import Card from "../models/Card.js";
import Member from "../models/Member.js";
import Project from "../models/Project.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";

async function verifyMemberForOrg(organizationId, userId) {
  const member = await Member.findOne({
    organization: organizationId,
    user: userId,
    isDeleted: false,
  });

  if (!member) {
    throw new AppError("You are not a member of this organization", 403);
  }

  if (member.isSuspended) {
    throw new AppError("Your account is suspended in this organization", 403);
  }

  return member;
}

// GET /api/activities?projectId=... or organizationId=... or cardId=...
export async function getActivities(req, res) {
  const { projectId, organizationId, cardId, limit = 30 } = req.query;

  const query = {};

  if (cardId && isValidObjectId(cardId)) {
    query.card = cardId;
    // Verify membership via the card's organization
    const card = await Card.findById(cardId).select("organization");
    if (card) {
      await verifyMemberForOrg(card.organization, req.user._id);
    }
  } else if (projectId && isValidObjectId(projectId)) {
    query.project = projectId;
    // Verify membership via the project's organization
    const project = await Project.findById(projectId).select("organization");
    if (project) {
      await verifyMemberForOrg(project.organization, req.user._id);
    }
  } else if (organizationId && isValidObjectId(organizationId)) {
    query.organization = organizationId;
    await verifyMemberForOrg(organizationId, req.user._id);
  } else {
    throw new AppError("Valid projectId, organizationId, or cardId is required", 400);
  }

  const activities = await Activity.find(query)
    .populate("user", "name email avathar")
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 30, 100));

  sendResponse(res, 200, "Activities fetched successfully", activities);
}
