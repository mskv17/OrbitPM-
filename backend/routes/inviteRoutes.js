import e from "express";
import { updateStatus, verifyToken } from "../controllers/inviteController.js";

const inviteRoutes = e.Router();

inviteRoutes.post("/verify-token", verifyToken);
inviteRoutes.patch("/update-status", updateStatus);

export default inviteRoutes;