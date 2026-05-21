import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PageLoader from "./ui/PageLoader.jsx";

const ProtectedRoute = ({ requireOnboarding = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireOnboarding && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (
    requireOnboarding &&
    user?.onboardingCompleted &&
    !user?.assessmentCompleted &&
    !user?.assessmentSkippedAt &&
    location.pathname !== "/assessment"
  ) {
    return <Navigate to="/assessment" replace />;
  }

  if (!requireOnboarding && user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
