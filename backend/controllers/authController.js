import { bcryptSaltRound } from "../constands/const";
import User from "../models/User";
import AppError from "../utils/AppError";
import bcrypt from "bcrypt";
import sendResponse from "../utils/sendResponse";
import {
  genAccessToken,
  genRefrshToken,
  genResetToken,
  verifyToken,
} from "../utils/generateTokens";
import getCookieCred from "../config/coockieCred";
import { sendResetPassEmail } from "../services/emailService";
import { redisClient } from "../config/reddis";
const accessTokenMaxAge = 15 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, getCookieCred(accessToken));
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
    throw new AppError("Email is already taken");
  }

  const hasedPassword = await bcrypt.hash(password, bcryptSaltRound);

  const user = new User({
    name,
    email: normEmail,
    avathar,
    password,
  });

  const token = genAccessToken(user);
  const refreshToken = genRefrshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(token, refreshToken);
  sendResponse(res, 201, "user registration completed", {
    user,
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
    throw new AppError("User not found", 404);
  }

  const hassedPassword = user.password;
  const isMatch = await bcrypt.compare(password, hassedPassword);

  if (!isMatch) {
    throw new AppError("Invalid email or Password");
  }

  const token = genAccessToken(user);
  const refreshToken = genRefrshToken(user);

  user.refreshToken = refreshToken;
  user.lastLoging = Date.now();
  await user.save();

  setAuthCookies(token, refreshToken);
  sendResponse(res, 200, "user logged successfuly", {
    name: user.name,
    email,
    normEmail,
  });
}

export async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("refreshToken is missing", 401);
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      cleareAuthCookies();
      throw new AppError("Invalid refresh token", 401);
    }
    const token = genAccessToken(user);
    const refreshToken = genRefrshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    setAuthCookies(token, refreshToken);
    sendResponse(res, 201, "new access token created");
  } catch (err) {
    cleareAuthCookies();
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
  const { resetToken, hash } = await genResetToken();
  user.resetToken = hash;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  await redisClient.set("email:" + normEmail, true, { EX: 120 });

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
  user.resetToken = "",
  await user.save();

  setAuthCookies(res,accessToken,refreshToken);
  sendResponse(res, 200, "Password updated successfuly");
}
