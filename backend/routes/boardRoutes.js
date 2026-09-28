import express from "express";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  getBoards,
  updateBoard,
} from "../controllers/boardController.js";

const boardRoutes = express.Router();

boardRoutes.post("/", createBoard);
boardRoutes.get("/", getBoards);
boardRoutes.get("/:id", getBoardById);
boardRoutes.patch("/:id", updateBoard);
boardRoutes.delete("/:id", deleteBoard);

export default boardRoutes;
