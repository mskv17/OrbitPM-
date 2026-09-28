import express from "express";
import {
  createList,
  deleteList,
  getLists,
  reorderLists,
  updateList,
} from "../controllers/listController.js";

const listRoutes = express.Router();

listRoutes.post("/", createList);
listRoutes.get("/", getLists);
listRoutes.patch("/reorder", reorderLists);
listRoutes.patch("/:id", updateList);
listRoutes.delete("/:id", deleteList);

export default listRoutes;
