import express from "express";
import {
  addAttachment,
  addChecklistItem,
  createCard,
  deleteAttachment,
  deleteCard,
  deleteChecklistItem,
  getCardById,
  getCards,
  moveCard,
  toggleArchiveCard,
  toggleChecklistItem,
  updateCard,
} from "../controllers/cardController.js";

const cardRoutes = express.Router();

cardRoutes.post("/", createCard);
cardRoutes.get("/", getCards);
cardRoutes.get("/:id", getCardById);
cardRoutes.patch("/:id/move", moveCard);
cardRoutes.patch("/:id/archive", toggleArchiveCard);
cardRoutes.patch("/:id", updateCard);
cardRoutes.delete("/:id", deleteCard);

// Checklist routes
cardRoutes.post("/:id/checklist", addChecklistItem);
cardRoutes.patch("/:id/checklist/:itemId", toggleChecklistItem);
cardRoutes.delete("/:id/checklist/:itemId", deleteChecklistItem);

// Attachment routes
cardRoutes.post("/:id/attachments", addAttachment);
cardRoutes.delete("/:id/attachments/:attachmentId", deleteAttachment);

export default cardRoutes;
