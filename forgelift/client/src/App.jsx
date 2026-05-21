import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PageTransition from "./components/layout/PageTransition.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import WorkoutDetailPage from "./pages/WorkoutDetailPage.jsx";
import WorkoutHistoryPage from "./pages/WorkoutHistoryPage.jsx";
import WorkoutLoggerPage from "./pages/WorkoutLoggerPage.jsx";

const AdvancedAnalyticsPage = lazy(() => import("./pages/AdvancedAnalyticsPage.jsx"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage.jsx"));
const DataManagementPage = lazy(() => import("./pages/DataManagementPage.jsx"));
const DeloadPage = lazy(() => import("./pages/DeloadPage.jsx"));
const GymModePage = lazy(() => import("./pages/GymModePage.jsx"));
const MissionsPage = lazy(() => import("./pages/MissionsPage.jsx"));
const MonthlyReportPage = lazy(() => import("./pages/MonthlyReportPage.jsx"));
const PRTimelinePage = lazy(() => import("./pages/PRTimelinePage.jsx"));
const RanksPage = lazy(() => import("./pages/RanksPage.jsx"));
const RecoveryPage = lazy(() => import("./pages/RecoveryPage.jsx"));
const SmartOverloadPage = lazy(() => import("./pages/SmartOverloadPage.jsx"));
const StrengthBaselinesPage = lazy(() => import("./pages/StrengthBaselinesPage.jsx"));
const TrainingBalancePage = lazy(() => import("./pages/TrainingBalancePage.jsx"));
const WeakPointsPage = lazy(() => import("./pages/WeakPointsPage.jsx"));
const WorkoutTemplatesPage = lazy(() => import("./pages/WorkoutTemplatesPage.jsx"));

const PageFallback = () => (
  <PageLoader text="Loading your training data..." />
);

const withTransition = (element) => <PageTransition>{element}</PageTransition>;

const App = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute requireOnboarding={false} />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={withTransition(<DashboardPage />)} />
          <Route path="/assessment" element={withTransition(<AssessmentPage />)} />
          <Route path="/data-management" element={withTransition(<DataManagementPage />)} />
          <Route path="/exercises" element={withTransition(<ExerciseLibraryPage />)} />
          <Route path="/profile" element={withTransition(<ProfilePage />)} />
          <Route path="/progress" element={withTransition(<AnalyticsPage />)} />
          <Route path="/analytics/advanced" element={withTransition(<AdvancedAnalyticsPage />)} />
          <Route path="/reports/monthly" element={withTransition(<MonthlyReportPage />)} />
          <Route path="/progress/prs" element={withTransition(<PRTimelinePage />)} />
          <Route path="/ranks" element={withTransition(<RanksPage />)} />
          <Route path="/recovery" element={withTransition(<RecoveryPage />)} />
          <Route path="/missions" element={withTransition(<MissionsPage />)} />
          <Route path="/gym-mode" element={withTransition(<GymModePage />)} />
          <Route path="/overload" element={withTransition(<SmartOverloadPage />)} />
          <Route path="/strength-baselines" element={withTransition(<StrengthBaselinesPage />)} />
          <Route path="/deload" element={withTransition(<DeloadPage />)} />
          <Route path="/training-balance" element={withTransition(<TrainingBalancePage />)} />
          <Route path="/weak-points" element={withTransition(<WeakPointsPage />)} />
          <Route path="/workout-templates" element={withTransition(<WorkoutTemplatesPage />)} />
          <Route path="/workouts" element={withTransition(<WorkoutHistoryPage />)} />
          <Route path="/workouts/new" element={withTransition(<WorkoutLoggerPage />)} />
          <Route path="/workouts/:id" element={withTransition(<WorkoutDetailPage />)} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
