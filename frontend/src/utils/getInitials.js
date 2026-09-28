/**
 * Utility function to extract 1-2 letter initials from a given string/name.
 * @param {string} str - Input name or title string
 * @param {string} fallback - Default fallback if str is empty/falsy
 * @returns {string} Initials in uppercase
 */
export function getInitials(str, fallback = "O") {
  if (!str || typeof str !== "string") return fallback;
  const parts = str.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
}

export default getInitials;
