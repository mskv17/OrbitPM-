import Card from "../models/Card.js";
import Comment from "../models/Comment.js";
import List from "../models/List.js";
import Member from "../models/Member.js";
import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";
import trackActivity from "../utils/helper/trackActivity.js";
import { getIO } from "../config/socket.js";

async function verifyMemberForOrg(organizationId, userId, allowedRoles = [], actionName = "perform this action") {
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

  if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
    throw new AppError(`Only ${allowedRoles.join(" or ")} can ${actionName}`, 403);
  }

  return member;
}

// POST /api/cards
export async function createCard(req, res) {
  const { title, listId, description, priority, dueDate } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new AppError("Card title is required", 400);
  }

  if (!listId || !isValidObjectId(listId)) {
    throw new AppError("Valid list ID is required", 400);
  }

  const list = await List.findOne({ _id: listId, isDeleted: false });
  if (!list) {
    throw new AppError("List not found", 404);
  }

  await verifyMemberForOrg(list.organization, req.user._id, ["owner", "admin", "editor"], "create cards");

  const lastCard = await Card.findOne({ list: listId, isDeleted: false }).sort({ position: -1 });
  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await Card.create({
    title: title.trim(),
    description: description ? String(description).trim() : "",
    list: listId,
    board: list.board,
    project: list.project,
    organization: list.organization,
    position,
    priority: priority || "medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: req.user._id,
  });

  // Track activity
  await trackActivity({
    userId: req.user._id,
    action: "created_card",
    details: `Created task "${card.title}"`,
    cardId: card._id,
    projectId: list.project,
    organizationId: list.organization,
  });

  const populated = await Card.findById(card._id)
    .populate("assignees", "name email avathar")
    .populate("createdBy", "name email avathar");

  const io = getIO();
  if (io) {
    io.to(`board:${list.board}`).emit("card:created", populated);
  }

  sendResponse(res, 201, "Card created successfully", populated);
}

// GET /api/cards?boardId=... or listId=...
export async function getCards(req, res) {
  const { boardId, listId, projectId, isArchived, search } = req.query;

  const query = { isDeleted: false };

  if (listId && isValidObjectId(listId)) {
    query.list = listId;
  } else if (boardId && isValidObjectId(boardId)) {
    query.board = boardId;
  } else if (projectId && isValidObjectId(projectId)) {
    query.project = projectId;
  } else {
    throw new AppError("Valid boardId, listId, or projectId query parameter is required", 400);
  }

  if (isArchived === "true") {
    query.isArchived = true;
  } else if (isArchived === "all") {
    // don't filter isArchived
  } else {
    query.isArchived = false;
  }

  if (search && typeof search === "string" && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const cards = await Card.find(query)
    .populate("assignees", "name email avathar")
    .populate("createdBy", "name email avathar")
    .sort({ position: 1 });

  sendResponse(res, 200, "Cards fetched successfully", cards);
}

// GET /api/cards/:id
export async function getCardById(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false })
    .populate("assignees", "name email avathar")
    .populate("createdBy", "name email avathar")
    .populate("list", "name position")
    .populate("board", "name")
    .populate("project", "name slug");

  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id);

  sendResponse(res, 200, "Card fetched successfully", card);
}

// PATCH /api/cards/:id
export async function updateCard(req, res) {
  const { id } = req.params;
  const { title, description, priority, dueDate, labels, assignees } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "update cards");

  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) throw new AppError("Card title cannot be empty", 400);
    card.title = trimmed;
  }

  if (description !== undefined) {
    card.description = String(description).trim();
  }

  if (priority !== undefined) {
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      throw new AppError("Invalid priority value", 400);
    }
    card.priority = priority;
  }

  if (dueDate !== undefined) {
    card.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (Array.isArray(labels)) {
    card.labels = labels;
  }

  if (Array.isArray(assignees)) {
    const oldAssigneeIds = (card.assignees || []).map((a) => String(a));
    const newAssigneeIds = assignees.map((a) => String(a));
    const newlyAdded = newAssigneeIds.filter(
      (id) => !oldAssigneeIds.includes(id) && id !== String(req.user._id)
    );

    for (const assigneeId of newlyAdded) {
      Notification.create({
        recipient: assigneeId,
        sender: req.user._id,
        type: "assignment",
        title: "Task Assigned",
        message: `You were assigned to "${card.title}"`,
        link: `/project/${card.project}`,
        organization: card.organization,
        project: card.project,
        card: card._id,
      })
        .then((notif) => {
          const io = getIO();
          if (io) {
            io.to(`user:${assigneeId}`).emit("notification:new", notif);
          }
        })
        .catch(() => {});
    }

    card.assignees = assignees;
  }

  await card.save();

  const populated = await Card.findById(card._id)
    .populate("assignees", "name email avathar")
    .populate("createdBy", "name email avathar");

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", populated);
  }

  sendResponse(res, 200, "Card updated successfully", populated);
}

// PATCH /api/cards/:id/move (Drag & Drop: move between lists and persist order)
export async function moveCard(req, res) {
  const { id } = req.params;
  const { targetListId, newPosition, orderedCardIds } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "move cards");

  const oldListId = String(card.list);
  const isDifferentList = targetListId && String(targetListId) !== oldListId;

  if (isDifferentList) {
    if (!isValidObjectId(targetListId)) {
      throw new AppError("Invalid target list ID", 400);
    }
    const targetList = await List.findOne({ _id: targetListId, isDeleted: false });
    if (!targetList) {
      throw new AppError("Target list not found", 404);
    }
    card.list = targetListId;

    await trackActivity({
      userId: req.user._id,
      action: "moved_card",
      details: `Moved "${card.title}" to ${targetList.name}`,
      cardId: card._id,
      projectId: card.project,
      organizationId: card.organization,
    });
  }

  if (typeof newPosition === "number") {
    card.position = newPosition;
  }

  await card.save();

  // If a reordered list of card IDs was provided for the destination list, bulk update
  if (Array.isArray(orderedCardIds) && orderedCardIds.length > 0) {
    const bulkOps = orderedCardIds.map((cardId, index) => ({
      updateOne: {
        filter: { _id: cardId },
        update: { $set: { position: index, list: targetListId || card.list } },
      },
    }));
    await Card.bulkWrite(bulkOps);
  }

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:moved", {
      cardId: card._id,
      oldListId,
      targetListId: targetListId || card.list,
      newPosition,
      orderedCardIds,
      updatedCard: card,
      actorId: req.user._id,
    });
  }

  sendResponse(res, 200, "Card moved successfully", card);
}

// DELETE /api/cards/:id
export async function deleteCard(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "delete cards");

  card.isDeleted = true;
  await card.save();

  // Cascade soft-delete associated comments
  await Comment.updateMany({ card: id, isDeleted: false }, { isDeleted: true });

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:deleted", {
      cardId: card._id,
      boardId: card.board,
      actorId: req.user._id,
    });
  }

  sendResponse(res, 200, "Card deleted successfully", { id: card._id, isDeleted: true });
}

// PATCH /api/cards/:id/archive
export async function toggleArchiveCard(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "archive cards");

  card.isArchived = !card.isArchived;
  await card.save();

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
  }

  const actionText = card.isArchived ? "archived" : "restored";
  sendResponse(res, 200, `Card ${actionText} successfully`, card);
}

// POST /api/cards/:id/checklist (Add checklist item)
export async function addChecklistItem(req, res) {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    throw new AppError("Item text is required", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "modify checklists");

  card.checklist.push({ text: text.trim(), isCompleted: false });
  await card.save();

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
    io.to(`card:${card._id}`).emit("card:checklist-updated", card.checklist);
  }

  sendResponse(res, 201, "Checklist item added", card.checklist);
}

// PATCH /api/cards/:id/checklist/:itemId (Toggle checklist item)
export async function toggleChecklistItem(req, res) {
  const { id, itemId } = req.params;

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "modify checklists");

  const item = card.checklist.id(itemId);
  if (!item) {
    throw new AppError("Checklist item not found", 404);
  }

  item.isCompleted = !item.isCompleted;
  await card.save();

  if (item.isCompleted) {
    await trackActivity({
      userId: req.user._id,
      action: "completed_checklist",
      details: `Completed "${item.text}" on card "${card.title}"`,
      cardId: card._id,
      projectId: card.project,
      organizationId: card.organization,
    });
  }

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
    io.to(`card:${card._id}`).emit("card:checklist-updated", card.checklist);
  }

  sendResponse(res, 200, "Checklist item updated", card.checklist);
}

// DELETE /api/cards/:id/checklist/:itemId
export async function deleteChecklistItem(req, res) {
  const { id, itemId } = req.params;

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "modify checklists");

  card.checklist.pull({ _id: itemId });
  await card.save();

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
    io.to(`card:${card._id}`).emit("card:checklist-updated", card.checklist);
  }

  sendResponse(res, 200, "Checklist item removed", card.checklist);
}

// POST /api/cards/:id/attachments
export async function addAttachment(req, res) {
  const { id } = req.params;
  const { name, url, fileType, size } = req.body;

  if (!url || !name) {
    throw new AppError("Attachment name and URL are required", 400);
  }

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "add attachments");

  card.attachments.push({
    name: name.trim(),
    url,
    fileType: fileType || "",
    size: size || 0,
  });

  await card.save();

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
    io.to(`card:${card._id}`).emit("card:attachments-updated", card.attachments);
  }

  sendResponse(res, 201, "Attachment added successfully", card.attachments);
}

// DELETE /api/cards/:id/attachments/:attachmentId
export async function deleteAttachment(req, res) {
  const { id, attachmentId } = req.params;

  const card = await Card.findOne({ _id: id, isDeleted: false });
  if (!card) {
    throw new AppError("Card not found", 404);
  }

  await verifyMemberForOrg(card.organization, req.user._id, ["owner", "admin", "editor"], "delete attachments");

  card.attachments.pull({ _id: attachmentId });
  await card.save();

  const io = getIO();
  if (io) {
    io.to(`board:${card.board}`).emit("card:updated", card);
    io.to(`card:${card._id}`).emit("card:attachments-updated", card.attachments);
  }

  sendResponse(res, 200, "Attachment removed successfully", card.attachments);
}
