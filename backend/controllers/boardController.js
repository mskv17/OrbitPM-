import Board from "../models/Board.js";
import Card from "../models/Card.js";
import List from "../models/List.js";
import Member from "../models/Member.js";
import Project from "../models/Project.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";

async function verifyMemberForProject(organizationId, userId, allowedRoles = [], actionName = "perform this action") {
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

// POST /api/boards
export async function createBoard(req, res) {
  const { name, description, projectId } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Board name is required", 400);
  }

  if (!projectId || !isValidObjectId(projectId)) {
    throw new AppError("Valid project ID is required", 400);
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await verifyMemberForProject(project.organization, req.user._id, ["owner", "admin", "editor"], "create boards");

  const board = await Board.create({
    name: name.trim(),
    description: description ? String(description).trim() : "",
    project: projectId,
    organization: project.organization,
    createdBy: req.user._id,
  });

  // Auto-seed default Kanban lists for a new board: Todo, Doing, Done
  await List.insertMany([
    { name: "Todo", board: board._id, project: projectId, organization: project.organization, position: 0 },
    { name: "Doing", board: board._id, project: projectId, organization: project.organization, position: 1 },
    { name: "Done", board: board._id, project: projectId, organization: project.organization, position: 2 },
  ]);

  sendResponse(res, 201, "Board created successfully", board);
}

// GET /api/boards?projectId=...
export async function getBoards(req, res) {
  const { projectId } = req.query;

  if (!projectId || !isValidObjectId(projectId)) {
    throw new AppError("Valid project ID query parameter is required", 400);
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await verifyMemberForProject(project.organization, req.user._id);

  let boards = await Board.find({ project: projectId, isDeleted: false })
    .populate("createdBy", "name email avathar")
    .sort({ createdAt: 1 });

  // If no board exists for this project yet, auto-create "Main Board"
  if (boards.length === 0) {
    const mainBoard = await Board.create({
      name: "Main Board",
      description: "Default Kanban board",
      project: projectId,
      organization: project.organization,
      createdBy: req.user._id,
    });

    await List.insertMany([
      { name: "Todo", board: mainBoard._id, project: projectId, organization: project.organization, position: 0 },
      { name: "Doing", board: mainBoard._id, project: projectId, organization: project.organization, position: 1 },
      { name: "Done", board: mainBoard._id, project: projectId, organization: project.organization, position: 2 },
    ]);

    boards = [mainBoard];
  }

  sendResponse(res, 200, "Boards fetched successfully", boards);
}

// GET /api/boards/:id
export async function getBoardById(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid board ID", 400);
  }

  const board = await Board.findOne({ _id: id, isDeleted: false })
    .populate("project", "name slug")
    .populate("organization", "name slug")
    .populate("createdBy", "name email avathar");

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForProject(board.organization._id || board.organization, req.user._id);

  sendResponse(res, 200, "Board fetched successfully", board);
}

// PATCH /api/boards/:id
export async function updateBoard(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid board ID", 400);
  }

  const board = await Board.findOne({ _id: id, isDeleted: false });
  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForProject(board.organization, req.user._id, ["owner", "admin", "editor"], "update boards");

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      throw new AppError("Board name cannot be empty", 400);
    }
    board.name = trimmed;
  }

  if (description !== undefined) {
    board.description = String(description).trim();
  }

  await board.save();

  sendResponse(res, 200, "Board updated successfully", board);
}

// DELETE /api/boards/:id
export async function deleteBoard(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid board ID", 400);
  }

  const board = await Board.findOne({ _id: id, isDeleted: false });
  if (!board) {
    throw new AppError("Board not found", 404);
  }

  await verifyMemberForProject(board.organization, req.user._id, ["owner", "admin"], "delete boards");

  board.isDeleted = true;
  await board.save();

  // Soft delete associated lists and cards
  await List.updateMany({ board: id }, { isDeleted: true });
  await Card.updateMany({ board: id }, { isDeleted: true });

  sendResponse(res, 200, "Board deleted successfully", { id: board._id, isDeleted: true });
}
