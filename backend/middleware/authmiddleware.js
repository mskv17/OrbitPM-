import { getRedisClient } from "../config/reddis.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/generateTokens.js";

export async function authMidleWare(req,res,next) {
    try {
        const token = req.cookies?.accessToken;
        if(!token) throw new AppError("token is required",401);
        const payload = verifyToken(token);
        const cacheKey = `user:${payload.id}`;
        const redisClient = getRedisClient();
        let user = await redisClient.get(cacheKey);
        if(user) {
            user = JSON.parse(user);
        } else {
            user = await User.findById(payload.id).select("-password").lean();

            if(!user) throw new AppError("User not found",401);

            await redisClient.set(cacheKey,JSON.stringify(user),{
                EX:2*60*60
            });

        }
        req.user = user;
        next();
    } catch (err) {
        throw new AppError("invalid token",401);
    }
}