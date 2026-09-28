import Activity from "../../models/Activity.js";

/**
 * Reusable helper to record an activity event asynchronously without blocking requests.
 */
export default async function trackActivity({
  userId,
  action,
  details,
  cardId = null,
  projectId,
  organizationId,
}) {
  try {
    await Activity.create({
      user: userId,
      action,
      details,
      card: cardId || undefined,
      project: projectId,
      organization: organizationId,
    });
  } catch (err) {
    console.error("Activity tracking error:", err);
  }
}
