import express from "express";
import { authMe, changePassword, ForgotPassword, login, logout, refreshToken, register, resetpassword, updateProfile, verifyEmail, verifyResetToken } from "../controllers/authController.js";
import { authMidleWare } from "../middleware/authmiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/register",register);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/login",login);
authRoutes.post("/refresh-token",refreshToken);
authRoutes.post("/logout",authMidleWare,logout);
authRoutes.post("/forgot-password",ForgotPassword);
authRoutes.post("/verify-reset-token",verifyResetToken);
authRoutes.post("/reset-password",resetpassword);
authRoutes.post("/change-password",authMidleWare,changePassword);
authRoutes.patch("/profile/update",authMidleWare,updateProfile);
authRoutes.get("/me",authMidleWare,authMe);

export default authRoutes;
