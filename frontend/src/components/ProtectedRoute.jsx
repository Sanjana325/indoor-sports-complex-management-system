import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { profileRouteForRole } from "../utils/navigation";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a nice spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Force Change Password Enforcement
  if (user?.mustChangePassword) {
    const profilePath = profileRouteForRole(user.role);
    if (location.pathname !== profilePath) {
      return <Navigate to={profilePath} replace />;
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their specific dashboard if trying to access unauthorized area
    const homePaths = {
      ADMIN: "/admin",
      SUPER_ADMIN: "/admin",
      STAFF: "/staff",
      COACH: "/coach",
      PLAYER: "/player"
    };
    return <Navigate to={homePaths[user.role] || "/"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
