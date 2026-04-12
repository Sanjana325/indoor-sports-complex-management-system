/**
 * Dynamically determines the profile route based on user role.
 * @param {string} role - The user role (e.g., ADMIN, STAFF, PLAYER).
 * @returns {string} - The absolute path to the profile page.
 */
export function profileRouteForRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN" || r === "SUPER_ADMIN") return "/admin/profile";
  if (r === "STAFF") return "/staff/profile";
  if (r === "COACH") return "/coach/profile";
  if (r === "PLAYER") return "/player/profile";
  return "/profile";
}

/**
 * Dynamically determines the home/dashboard route based on user role.
 * @param {string} role - The user role.
 * @returns {string} - The absolute path to the home page.
 */
export function homeRouteForRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN" || r === "SUPER_ADMIN") return "/admin";
  if (r === "STAFF") return "/staff";
  if (r === "COACH") return "/coach";
  if (r === "PLAYER") return "/player";
  return "/";
}
