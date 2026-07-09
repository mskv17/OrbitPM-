import express from "express";
import { ForgotPassword, login, logout, refreshToken, register, resetpassword } from "../controllers/authController";
import { authMidleWare } from "../middleware/authmiddleware";

const authRoutes = express.Router();

authRoutes.post("/register",register);
authRoutes.post("/login",login);
authRoutes.post("/refresh-token",refreshToken);
authRoutes.post("/logout",authMidleWare,logout);
authRoutes.post("/forgot-password",ForgotPassword);
authRoutes.post("/reset-password",resetpassword);

export default authRoutes;