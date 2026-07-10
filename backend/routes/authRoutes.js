import express from "express";
import { authMe, ForgotPassword, login, logout, refreshToken, register, resetpassword } from "../controllers/authController.js";
import { authMidleWare } from "../middleware/authmiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/register",register);
authRoutes.post("/login",login);
authRoutes.post("/refresh-token",refreshToken);
authRoutes.post("/logout",authMidleWare,logout);
authRoutes.post("/forgot-password",ForgotPassword);
authRoutes.post("/reset-password",resetpassword);
authRoutes.get("/me",authMidleWare,authMe);

export default authRoutes;