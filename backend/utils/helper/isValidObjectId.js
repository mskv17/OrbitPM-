import mongoose from "mongoose";

/**
 * Checks if a given value is a valid 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
}

export default isValidObjectId;
