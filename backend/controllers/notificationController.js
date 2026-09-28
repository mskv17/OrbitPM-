import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import isValidObjectId from "../utils/helper/isValidObjectId.js";
import sendResponse from "../utils/sendResponse.js";

// GET /api/notifications
export async function getNotifications(req, res) {
  const { isRead } = req.query;

  const query = { recipient: req.user._id };

  if (isRead === "false") {
    query.isRead = false;
  } else if (isRead === "true") {
    query.isRead = true;
  }

  const notifications = await Notification.find(query)
    .populate("sender", "name email avathar")
    .populate("organization", "name slug")
    .sort({ createdAt: -1 })
    .limit(40);

  sendResponse(res, 200, "Notifications fetched successfully", notifications);
}

// GET /api/notifications/unread-count
export async function getUnreadCount(req, res) {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  sendResponse(res, 200, "Unread count fetched", { count });
}

// PATCH /api/notifications/:id/read
export async function markAsRead(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid notification ID", 400);
  }

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.isRead = true;
  await notification.save();

  sendResponse(res, 200, "Notification marked as read", notification);
}

// PATCH /api/notifications/read-all
export async function markAllAsRead(req, res) {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  sendResponse(res, 200, "All notifications marked as read");
}
