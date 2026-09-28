import express from "express";
import { getActivities } from "../controllers/activityController.js";

const activityRoutes = express.Router();

activityRoutes.get("/", getActivities);

export default activityRoutes;
