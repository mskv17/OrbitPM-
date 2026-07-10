import jwt from "jsonwebtoken";
import crypto from "crypto";

export function genAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "jwt_secret",
    { expiresIn: process.env.ACCESS_TOKEN_MAX_AGE || "15m" }
  );
}

export function genRefrshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret",
    { expiresIn: process.env.REFRESH_TOKEN_MAX_AGE || "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret"
  );
}

export function genResetToken(
  resetToken = crypto.randomBytes(32).toString("hex")
) {
  const hash = crypto.createHash("sha256").update(resetToken).digest("hex");
  return {
    resetToken,
    hash,
  };
}
