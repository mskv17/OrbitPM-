import express from "express";
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../controllers/commentController.js";

const commentRoutes = express.Router();

commentRoutes.post("/", createComment);
commentRoutes.get("/", getComments);
commentRoutes.patch("/:id", updateComment);
commentRoutes.delete("/:id", deleteComment);

export default commentRoutes;
