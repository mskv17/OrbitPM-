import express from "express";
import { omniSearch, searchUsersByEmail } from "../controllers/searchController.js";

const searchRoutes = express.Router();

searchRoutes.get("/users-by-email", searchUsersByEmail);
searchRoutes.get("/omni", omniSearch);

export default searchRoutes;