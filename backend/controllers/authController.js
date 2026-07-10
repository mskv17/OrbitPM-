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
import { sendResetPassEmail } from "../services/emailService.js";
import { getRedisClient } from "../config/reddis.js";
import sanitizeUser from "../utils/helper/sanitizeUser.js";
const accessTokenMaxAge = 15 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, getCookieCred(accessTokenMaxAge));
  res.cookie("refreshToken", refreshToken, getCookieCred());
}

function cleareAuthCookies(res) {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
}

function validateEmil(normEmail) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normEmail)) {
    throw new AppError("Please provide a valid email address", 400);
  }
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
  await user.save();

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
  ((user.resetToken = ""), await user.save());

  setAuthCookies(res, accessToken, refreshToken);
  sendResponse(res, 200, "Password updated successfuly",{user:sanitizeUser(user)});
}

export function authMe(req, res) {
  const user = req.user;
  sendResponse(res, 200, "user data fetced", { user });
}
