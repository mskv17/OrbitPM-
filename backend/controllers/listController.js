import Board from "../models/Board.js";
import Card from "../models/Card.js";
import List from "../models/List.js";
import Member from "../models/Member.js";
import { getIO } from "../config/socket.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";

async function verifyMemberForBoard(organizationId, userId, allowedRoles = [], actionName = "perform this action") {
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

// POST /api/lists
export async function createList(req, res) {
  const { name, boardId } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("List title is required", 400);
  }

  if (!boardId || !isValidObjectId(boardId)) {
    throw new AppError("Valid board ID is required", 400);
  }

  const board = await Board.findOne({ _id: boardId, isDeleted: false });
  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForBoard(board.organization, req.user._id, ["owner", "admin", "editor"], "create lists");

  // Determine next position
  const lastList = await List.findOne({ board: boardId, isDeleted: false }).sort({ position: -1 });
  const position = lastList ? lastList.position + 1 : 0;

  const list = await List.create({
    name: name.trim(),
    board: boardId,
    project: board.project,
    organization: board.organization,
    position,
  });

  const io = getIO();
  if (io) {
    io.to(`board:${boardId}`).emit("list:created", list);
  }

  sendResponse(res, 201, "List created successfully", list);
}

// GET /api/lists?boardId=...
export async function getLists(req, res) {
  const { boardId } = req.query;

  if (!boardId || !isValidObjectId(boardId)) {
    throw new AppError("Valid board ID query parameter is required", 400);
  }

  const board = await Board.findOne({ _id: boardId, isDeleted: false });
  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForBoard(board.organization, req.user._id);

  const lists = await List.find({ board: boardId, isDeleted: false }).sort({ position: 1 });

  sendResponse(res, 200, "Lists fetched successfully", lists);
}

// PATCH /api/lists/:id (Rename list)
export async function updateList(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid list ID", 400);
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("List title cannot be empty", 400);
  }

  const list = await List.findOne({ _id: id, isDeleted: false });
  if (!list) {
    throw new AppError("List not found", 404);
  }

  await verifyMemberForBoard(list.organization, req.user._id, ["owner", "admin", "editor"], "update lists");

  list.name = name.trim();
  await list.save();

  const io = getIO();
  if (io) {
    io.to(`board:${list.board}`).emit("list:updated", list);
  }

  sendResponse(res, 200, "List renamed successfully", list);
}

// DELETE /api/lists/:id
export async function deleteList(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid list ID", 400);
  }

  const list = await List.findOne({ _id: id, isDeleted: false });
  if (!list) {
    throw new AppError("List not found", 404);
  }

  await verifyMemberForBoard(list.organization, req.user._id, ["owner", "admin", "editor"], "delete lists");

  list.isDeleted = true;
  await list.save();

  // Cascade soft-delete cards under this list
  await Card.updateMany({ list: id, isDeleted: false }, { isDeleted: true });

  const io = getIO();
  if (io) {
    io.to(`board:${list.board}`).emit("list:deleted", { id: list._id, boardId: list.board });
  }

  sendResponse(res, 200, "List deleted successfully", { id: list._id, isDeleted: true });
}

// PATCH /api/lists/reorder
export async function reorderLists(req, res) {
  const { boardId, orderedListIds } = req.body;

  if (!boardId || !isValidObjectId(boardId)) {
    throw new AppError("Valid board ID is required", 400);
  }

  if (!Array.isArray(orderedListIds) || orderedListIds.length === 0) {
    throw new AppError("orderedListIds must be a non-empty array of IDs", 400);
  }

  const board = await Board.findOne({ _id: boardId, isDeleted: false });
  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForBoard(board.organization, req.user._id, ["owner", "admin", "editor"], "reorder lists");

  // Perform bulk update to persist list positions efficiently
  const bulkOps = orderedListIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, board: boardId },
      update: { $set: { position: index } },
    },
  }));

  await List.bulkWrite(bulkOps);

  const updatedLists = await List.find({ board: boardId, isDeleted: false }).sort({ position: 1 });

  const io = getIO();
  if (io) {
    io.to(`board:${boardId}`).emit("list:reordered", updatedLists);
  }

  sendResponse(res, 200, "Lists reordered successfully", updatedLists);
}
