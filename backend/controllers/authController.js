import { bcryptSaltRound } from "../constands/const.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcrypt";
import sendResponse from "../utils/sendResponse.js";
import {
  genAccessToken,
  genRefrshToken,
  genResetToken,
  verifyRefreshToken,
} from "../utils/generateTokens.js";
import getCookieCred from "../config/coockieCred.js";
import {
  sendEmailVerification,
  sendResetPassEmail,
} from "../services/emailService.js";
import { getRedisClient } from "../config/reddis.js";
import sanitizeUser from "../utils/helper/sanitizeUser.js";
const accessTokenMaxAge = 15 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, getCookieCred(accessTokenMaxAge));
  res.cookie("refreshToken", refreshToken, getCookieCred());
}

function cleareAuthCookies(res) {
  res.clearCookie("refreshToken", getCookieCred());
  res.clearCookie("accessToken", getCookieCred(accessTokenMaxAge));
}

function validateEmil(normEmail) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normEmail)) {
    throw new AppError("Please provide a valid email address", 400);
  }
}

async function sendVerificationEmail(user) {
  const verification = genResetToken();

  user.verificationToken = verification.hash;
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  await sendEmailVerification(user.email, verification.resetToken);
}

export async function register(req, res) {
  const { name, email, password, avathar = "" } = req.body;
  if (!name || !email || !password) {
    throw new AppError("All fields are required");
  }
  const normEmail = email.trim().toLowerCase();
  validateEmil(normEmail);

  const isAlreadyExist = await User.findOne({ email: normEmail });

  if (isAlreadyExist) {
    throw new AppError("Email is already taken", 400);
  }

  if (String(password).length < 8) {
    throw new AppError("Password requires a minimum of 8 characters", 400);
  }

  const hasedPassword = await bcrypt.hash(password, bcryptSaltRound);

  const user = new User({
    name,
    email: normEmail,
    avathar,
    password: hasedPassword,
  });

  const token = genAccessToken(user);
  const refreshToken = genRefrshToken(user);

  user.refreshToken = refreshToken;
  await sendVerificationEmail(user);

  setAuthCookies(res, token, refreshToken);
  sendResponse(res, 201, "user registration completed", {
    user: sanitizeUser(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("All fields are required", 400);
  }
  const normEmail = email.trim().toLowerCase();
  validateEmil(normEmail);

  const user = await User.findOne({
    email: normEmail,
    isDeleted: false,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or Password", 404);
  }

  const hassedPassword = user.password;
  const isMatch = await bcrypt.compare(password, hassedPassword);

  if (!isMatch) {
    throw new AppError("Invalid email or Password", 400);
  }

  const token = genAccessToken(user);
  const refreshToken = genRefrshToken(user);

  user.refreshToken = refreshToken;
  user.lastLoging = Date.now();
  await user.save();

  setAuthCookies(res, token, refreshToken);
  sendResponse(res, 200, "user logged successfuly", {
    user: sanitizeUser(user),
  });

  //background task send email verification if not verified

  if (!user.isVerified) {
    await sendVerificationEmail(user);
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.body;
  if (!token) throw new AppError("Verification token is required", 400);

  const { hash } = genResetToken(token);
  const user = await User.findOne({
    verificationToken: hash,
    isDeleted: false,
  }).select("+verificationToken");

  if (!user) throw new AppError("Invalid verification token", 400);
  if (
    !user.verificationTokenExpires ||
    user.verificationTokenExpires < Date.now()
  ) {
    throw new AppError("Verification token has expired", 400);
  }

  user.isVerified = true;
  user.verificationToken = "";
  user.verificationTokenExpires = null;
  await user.save();

  const redisClient = getRedisClient();
  const cacheKey = `user:${user._id}`;
  await redisClient.del(cacheKey);

  sendResponse(res, 200, "Email verified successfully", {
    user: sanitizeUser(user),
  });
}

export async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("refreshToken is missing", 401);
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      cleareAuthCookies(res);
      throw new AppError("Invalid refresh token", 401);
    }
    const accessToken = genAccessToken(user);
    const refreshToken = genRefrshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);
    sendResponse(res, 201, "new access token created", {
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    cleareAuthCookies(res);
    throw new AppError("Invalid refresh token", 401);
  }
}

export async function logout(req, res) {
  cleareAuthCookies(res);
  const user = req.user;
  await User.findByIdAndUpdate(user._id, { refreshToken: "" });
  sendResponse(res, 200, "Logged out successfully");
}

export async function ForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) throw new AppError("Eamil is required");
  const normEmail = email.trim().toLowerCase();
  validateEmil(normEmail);
  const redisClient = getRedisClient();
  const isAlreadySend = await redisClient.get("email:" + normEmail);
  if (isAlreadySend)
    throw new AppError(
      "You can request another reset link after 2 minutes seconds.",
      400
    );
  const user = await User.findOne({ email: normEmail, isDeleted: false });
  if (!user)
    return sendResponse(
      res,
      200,
      "If the account exists, you will receive instructions."
    );
  const { resetToken, hash } = genResetToken();
  user.resetToken = hash;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  await redisClient.set("email:" + normEmail, "1", { EX: 120 });

  await sendResetPassEmail(normEmail, resetToken);

  sendResponse(
    res,
    200,
    "Password reset instructions sent if account exists. Check your email inbox."
  );
}

export async function resetpassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError("All fields are required", 400);
  const { hash } = genResetToken(token);
  const user = await User.findOne({ resetToken: hash, isDeleted: false });
  if (!user) throw new AppError("Invalide token", 404);
  if (user.resetTokenExpires < Date.now())
    throw new AppError("Reset link has expired", 400);

  const hashedPassword = await bcrypt.hash(password, bcryptSaltRound);
  const refreshToken = genRefrshToken(user);
  const accessToken = genAccessToken(user);
  user.password = hashedPassword;
  user.refreshToken = refreshToken;
  user.resetToken = "";
  user.resetTokenExpires = null;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  sendResponse(res, 200, "Password updated successfuly", {
    user: sanitizeUser(user),
  });
}

export async function verifyResetToken(req, res) {
  const { token } = req.body;
  if (!token) throw new AppError("Reset token is required", 400);

  const { hash } = genResetToken(token);
  const user = await User.findOne({
    resetToken: hash,
    isDeleted: false,
  }).select("+resetToken");

  if (!user) throw new AppError("Invalid reset token", 400);
  if (!user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    throw new AppError("Reset token has expired", 400);
  }

  sendResponse(res, 200, "Reset token is valid", { valid: true });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (String(newPassword).length < 8) {
    throw new AppError("Password requires a minimum of 8 characters", 400);
  }

  const user = await User.findOne({
    _id: req.user._id,
    isDeleted: false,
  }).select("+password");

  if (!user) throw new AppError("User not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 400);

  user.password = await bcrypt.hash(newPassword, bcryptSaltRound);
  await user.save();

  const redisClient = getRedisClient();
  const cacheKey = `user:${user._id}`;
  await redisClient.del(cacheKey);

  sendResponse(res, 200, "Password changed successfuly");
}

export async function updateProfile(req, res) {
  const { updates } = req.body;
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new AppError("updates is required", 400);
  }

  const allowedUpdates = ["name", "avathar"];
  const requestedUpdates = Object.keys(updates);

  if (requestedUpdates.length === 0) {
    throw new AppError("No updates provided", 400);
  }

  const hasInvalidField = requestedUpdates.some((field) => !allowedUpdates.includes(field));
  if (hasInvalidField) {
    throw new AppError("Invalid fields in update request", 400);
  }

  const userUpdates = {};
  if (Object.hasOwn(updates, "name")) {
    const name = String(updates.name).trim();
    if (name.length < 2 || name.length > 50) {
      throw new AppError("Name must be between 2 and 50 characters", 400);
    }
    userUpdates.name = name;
  }

  if (Object.hasOwn(updates, "avathar")) {
    userUpdates.avathar = String(updates.avathar || "").trim();
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user._id, isDeleted: false },
    { $set: userUpdates },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("User not found", 404);

  const redisClient = getRedisClient();
  const cacheKey = `user:${user._id}`;
  await redisClient.del(cacheKey);

  sendResponse(res, 200, "Profile updated successfuly", {
    user: sanitizeUser(user),
  });
}

export function authMe(req, res) {
  const user = req.user;
  sendResponse(res, 200, "user data fetced", { user });
}
