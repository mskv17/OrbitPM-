import { isValidObjectId } from "mongoose";
import Member from "../models/Member.js";
import AppError from "../utils/AppError.js";
import { getRedisClient } from "../config/reddis.js";

/**
 * 
 * @param {string[]} roles 
 * @returns {Function}
 */

export function roleMiddleware(roles = [], action = "this action") {
    return async (req, res, next) => {
        const currentUser = req.user;
        // Support organizationId from URL params, body, or query
        const organizationId = req.params.organizationId ?? req.body.organizationId ?? req.query.organizationId;

        const isObjectId = isValidObjectId(organizationId);
        if (!isObjectId) {
            throw new AppError("Invalid organization ID", 400);
        }

        let currentMember;
        const cacheKey = `memeber:${currentUser._id}:${organizationId}`;
        const redisClient = getRedisClient();
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            currentMember = JSON.parse(cached);
        } else {
            currentMember = await Member.findOne({
                organization: organizationId,
                user: currentUser._id,
                isDeleted: false,
            });
            if (currentMember) {
                await redisClient.set(cacheKey, JSON.stringify(currentMember), {
                    EX: 2 * 60 * 60
                });
            }
        }

        if (!currentMember || currentMember.isDeleted) {
            throw new AppError("You are not a member of this organization", 404);
        }

        if (currentMember.isSuspended) {
            throw new AppError("Your account has been suspended in this organization", 403);
        }

        if (roles.length > 0 && !roles.includes(currentMember.role)) {
            throw new AppError(`Only the ${roles.join(" or ")} of the organization can ${action}`, 403);
        }

        req.currentMember = currentMember;
        next();
    }
}