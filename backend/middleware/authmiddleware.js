import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/generateTokens.js";

export async function authMidleWare(req,res,next) {
    try {
        const token = req.cookies?.accessToken;
        if(!token) throw new AppError("token is required",401);
        const payload = verifyToken(token);
        const user = await User.findById(payload.id).select("-password").lean();
        if(!user) throw new AppError("User not found",401);
        req.user = user;
        next();
    } catch (err) {
        throw new AppError("invalid token",401);
    }
}