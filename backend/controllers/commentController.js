import Card from "../models/Card.js";
import Comment from "../models/Comment.js";
import Member from "../models/Member.js";
import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";
import trackActivity from "../utils/helper/trackActivity.js";

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

// POST /api/comments
export async function createComment(req, res) {
  const { cardId, text } = req.body;

  if (!cardId || !isValidObjectId(cardId)) {
    throw new AppError("Valid card ID is required", 400);
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    throw new AppError("Comment text is required", 400);
  }

  const card = await Card.findOne({ _id: cardId, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  const member = await verifyMemberForOrg(card.organization, req.user._id);
  if (member.role === "viewer") {
    throw new AppError("Viewers cannot add comments", 403);
  }

  const comment = await Comment.create({
    card: cardId,
    user: req.user._id,
    text: text.trim(),
  });

  await trackActivity({
    userId: req.user._id,
    action: "added_comment",
    details: `Commented on "${card.title}"`,
    cardId: card._id,
    projectId: card.project,
    organizationId: card.organization,
  });

  // Notify card creator and assignees (except the comment author)
  const recipients = new Set();
  if (card.createdBy && String(card.createdBy) !== String(req.user._id)) {
    recipients.add(String(card.createdBy));
  }
  (card.assignees || []).forEach((a) => {
    const aid = String(typeof a === "object" ? a._id : a);
    if (aid !== String(req.user._id)) {
      recipients.add(aid);
    }
  });

  const io = getIO();

  for (const recipientId of recipients) {
    Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: "comment",
      title: "New Comment",
      message: `${req.user.name || "A teammate"} commented on "${card.title}"`,
      link: `/project/${card.project}`,
      organization: card.organization,
      project: card.project,
      card: card._id,
    })
      .then((notif) => {
        if (io) {
          io.to(`user:${recipientId}`).emit("notification:new", notif);
        }
      })
      .catch(() => {});
  }

  const populated = await Comment.findById(comment._id).populate("user", "name email avathar");

  if (io) {
    io.to(`card:${cardId}`).emit("comment:created", populated);
    io.to(`board:${card.board}`).emit("card:updated", card);
  }

  sendResponse(res, 201, "Comment added successfully", populated);
}

// GET /api/comments?cardId=...
export async function getComments(req, res) {
  const { cardId } = req.query;

  if (!cardId || !isValidObjectId(cardId)) {
    throw new AppError("Valid card ID query parameter is required", 400);
  }

  const card = await Card.findOne({ _id: cardId, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id);

  const comments = await Comment.find({ card: cardId, isDeleted: false })
    .populate("user", "name email avathar")
    .sort({ createdAt: 1 });

  sendResponse(res, 200, "Comments fetched successfully", comments);
}

// PATCH /api/comments/:id
export async function updateComment(req, res) {
  const { id } = req.params;
  const { text } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid comment ID", 400);
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    throw new AppError("Comment text cannot be empty", 400);
  }

  const comment = await Comment.findOne({ _id: id, isDeleted: false });
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (String(comment.user) !== String(req.user._id)) {
    throw new AppError("You can only edit your own comments", 403);
  }

  comment.text = text.trim();
  comment.isEdited = true;
  await comment.save();

  const populated = await Comment.findById(comment._id).populate("user", "name email avathar");

  const io = getIO();
  if (io) {
    io.to(`card:${comment.card}`).emit("comment:updated", populated);
  }

  sendResponse(res, 200, "Comment updated successfully", populated);
}

// DELETE /api/comments/:id
export async function deleteComment(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid comment ID", 400);
  }

  const comment = await Comment.findOne({ _id: id, isDeleted: false });
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  const card = await Card.findById(comment.card);
  const member = await verifyMemberForOrg(card.organization, req.user._id);

  const isAuthor = String(comment.user) === String(req.user._id);
  const isManager = member.role === "owner" || member.role === "admin";

  if (!isAuthor && !isManager) {
    throw new AppError("You do not have permission to delete this comment", 403);
  }

  comment.isDeleted = true;
  await comment.save();

  const io = getIO();
  if (io) {
    io.to(`card:${comment.card}`).emit("comment:deleted", {
      commentId: comment._id,
      cardId: comment.card,
    });
  }

  sendResponse(res, 200, "Comment deleted successfully", { id: comment._id, isDeleted: true });
}
