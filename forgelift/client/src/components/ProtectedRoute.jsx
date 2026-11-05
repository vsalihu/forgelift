import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import ServerWakeScreen from "./auth/ServerWakeScreen.jsx";
import DailyGate from "./daily/DailyGate.jsx";
import WhatsNewGate from "./whatsnew/WhatsNewGate.jsx";
import { DailyProvider } from "../context/DailyContext.jsx";

const ProtectedRoute = ({ requireOnboarding = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <ServerWakeScreen title="Checking your session…" />;
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

  if (!requireOnboarding) return <Outlet />;

  return (
    <DailyProvider>
      <Outlet />
      <WhatsNewGate />
      <DailyGate />
    </DailyProvider>
  );
};

export default ProtectedRoute;
