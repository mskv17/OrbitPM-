/**
 * Generates a clean URL slug from a name/text and optional identifier (e.g. userId).
 *
 * @param {string} text - The primary text (e.g. organization name)
 * @param {string|object} [id=""] - Optional identifier to append (e.g. req.user._id)
 * @returns {string} The formatted URL slug
 */
export default function generateSlug(text, id = "") {
  if (!text) return "";
  
  const idStr = id ? String(id).trim() : "";
  const combined = idStr ? `${text} ${idStr}` : String(text);

  return combined
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
