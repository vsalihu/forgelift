import "@fontsource-variable/archivo/wdth.css";
import "../components/landing/landing.css";
import { Navigate } from "react-router-dom";
import CoachStory from "../components/landing/CoachStory.jsx";
import CompeteSection from "../components/landing/CompeteSection.jsx";
import FeatureBento from "../components/landing/FeatureBento.jsx";
import { FinalCta, LandingFooter } from "../components/landing/FinalCta.jsx";
import Hero from "../components/landing/Hero.jsx";
import LandingNav from "../components/landing/LandingNav.jsx";
import RankLadder from "../components/landing/RankLadder.jsx";
import { useAuth } from "../hooks/useAuth.js";

const LandingPage = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  return (
    <div className="landing relative min-h-[100dvh] overflow-x-clip text-white">
      <div aria-hidden="true" className="landing-grain" />
      <LandingNav />
      <main>
        <Hero />
        <RankLadder />
        <CoachStory />
        <FeatureBento />
        <CompeteSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
