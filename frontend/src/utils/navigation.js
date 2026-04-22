// finds the correct profile link based on what role the user has
export function profileRouteForRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN" || r === "SUPER_ADMIN") return "/admin/profile";
  if (r === "STAFF") return "/staff/profile";
  if (r === "COACH") return "/coach/profile";
  if (r === "PLAYER") return "/player/profile";
  return "/profile";
}

// finds the main dashboard link for each user role
export function homeRouteForRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN" || r === "SUPER_ADMIN") return "/admin";
  if (r === "STAFF") return "/staff";
  if (r === "COACH") return "/coach";
  if (r === "PLAYER") return "/player";
  return "/";
}
