import express from "express";
import { createPath } from "../controllers/storageController.js";

const storageRoutes = express.Router();

storageRoutes.post("/create-path", createPath);

export default storageRoutes;
