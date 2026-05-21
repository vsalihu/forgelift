import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const ProtectedRoute = ({ requireOnboarding = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-iron-steel">
        Loading IronRank...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireOnboarding && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarding && user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
