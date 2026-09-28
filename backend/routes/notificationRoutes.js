import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationController.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.get("/unread-count", getUnreadCount);
notificationRoutes.patch("/read-all", markAllAsRead);
notificationRoutes.patch("/:id/read", markAsRead);

export default notificationRoutes;
