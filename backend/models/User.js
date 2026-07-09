import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avathar: {
      type: "string",
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLoging: {
      type: Date,
    },
    refreshToken: {
      type: String,
      default: "",
      select: false,
    },
    resetToken: {
      type: String,
      default: "",
      select: false,
    },
    resetTokenExpires:Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
