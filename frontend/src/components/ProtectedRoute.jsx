import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { profileRouteForRole } from "../utils/navigation";

// higher-order route guard for enforcing authentication and role-based permissions
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; 
  }

  // kick unauthorized guests back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // hard redirect to profile settings if the system flags a mandatory password rotation
  if (user?.mustChangePassword) {
    const profilePath = profileRouteForRole(user.role);
    if (location.pathname !== profilePath) {
      return <Navigate to={profilePath} replace />;
    }
  }

  // cross-reference user role against allowed list to prevent lateral access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
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
