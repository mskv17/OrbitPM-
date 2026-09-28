import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "admin", "editor", "viewer"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    token: {
        type: String,
        required: true,
        select: false
    }
}, {
    timestamps: true
});

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;