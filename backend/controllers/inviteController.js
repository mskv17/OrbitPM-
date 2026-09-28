import Invitation from "../models/Invitation.js";
import Member from "../models/Member.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { genResetToken } from "../utils/generateTokens.js";
import sendResponse from "../utils/sendResponse.js";

export async function verifyToken(req, res) {
    const { token } = req.body;
    if (!token) throw new AppError("Token is required", 400);

    const { hash } = genResetToken(token);
    const invitation = await Invitation.findOne({ token: hash, status: "pending" })
        .populate("organization", "name logo description slug")
        .populate("to", "name email avathar");

    if (!invitation) {
        throw new AppError("Invalid or expired invitation link", 400);
    }

    sendResponse(res, 200, "Invitation token verified successfully", invitation);
}

export async function updateStatus(req, res) {
    const { token, status } = req.body;
    if (!token || !status) throw new AppError("Token and status are required", 400);
    if (status !== "accepted" && status !== "rejected") throw new AppError("Invalid status", 400);

    const { hash } = genResetToken(token);
    const invitation = await Invitation.findOneAndUpdate({ token: hash, status: "pending" }, { status }, { new: true })
        .populate("organization", "name logo description slug")
        .populate("to", "name email avathar");

    if (!invitation) {
        throw new AppError("Invalid or expired invitation link", 400);
    }

    // Verify the authenticated user is the intended recipient
    if (String(invitation.to._id) !== String(req.user._id)) {
        throw new AppError("This invitation is not addressed to you", 403);
    }

    if (status === "accepted") {
        const user = await User.findById(invitation.to._id);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        user.totalMemberShips++;

        await Member.create({
            user: user._id,
            organization: invitation.organization._id,
            role: invitation.role,
        });

        // Update org member count
        await Organization.findByIdAndUpdate(invitation.organization._id, { $inc: { totalTeamMembers: 1 } });

        await user.save();
    }

    sendResponse(res, 200, `Invitation ${status} successfully`, invitation);
}