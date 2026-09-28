import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression"
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import { configDotenv } from "dotenv";
import { authMidleWare } from "./middleware/authmiddleware.js";
import storageRoutes from "./routes/storageRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

configDotenv();
const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4321",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/status", (req, res) => {
    res.json({
        status: "ok"
    })
});

app.use("/api/auth", authRoutes);
app.use("/api/storage", authMidleWare, storageRoutes);
app.use("/api/organizations", authMidleWare, organizationRoutes);
app.use("/api/projects", authMidleWare, projectRoutes);
app.use("/api/boards", authMidleWare, boardRoutes);
app.use("/api/lists", authMidleWare, listRoutes);
app.use("/api/cards", authMidleWare, cardRoutes);
app.use("/api/comments", authMidleWare, commentRoutes);
app.use("/api/activities", authMidleWare, activityRoutes);
app.use("/api/notifications", authMidleWare, notificationRoutes);
app.use("/api/search", authMidleWare, searchRoutes);
app.use("/api/invites", authMidleWare, inviteRoutes);

app.get("{*splat}", (req, res) => {
    res.status(404).send("404 Page not found");
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (!err.statusCode) {
        console.error(err);
    }
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.statusCode ? err.message : "Internal Server Error"
    });
});

export default app;