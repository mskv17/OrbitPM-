import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        default: "Member",
    },
    role: {
        type: String,
        enum: ["owner", "admin", "editor", "viewer"],
        default: "viewer",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
});

memberSchema.index({ organization: 1, user: 1 });

const Member = mongoose.model("Member", memberSchema);
export default Member;