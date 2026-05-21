import { ArrowRight, ShieldCheck, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";

const LandingPage = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-iron-copper">
            Smart gym progression
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight text-white sm:text-6xl">
            IronRank
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A premium foundation for tracking future ranks, weak points, recovery, personal records,
            and overload recommendations. Stage 1 includes secure accounts, onboarding, and the core
            dashboard shell.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-iron-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              to="/register"
            >
              Start foundation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/15"
              to="/login"
            >
              Login
            </Link>
          </div>
        </motion.section>

        <motion.section
          className="grid gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[
            { icon: Trophy, title: "Rank-ready shell", text: "Structured cards for future rank and XP data." },
            { icon: ShieldCheck, title: "JWT authentication", text: "Protected routes and profile storage." },
            { icon: Zap, title: "Goal-aware onboarding", text: "Gender-aware defaults without assumptions." }
          ].map((item) => (
            <div className="metal-panel rounded-lg p-5" key={item.title}>
              <item.icon className="mb-4 h-7 w-7 text-iron-ember" />
              <h2 className="text-lg font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </div>
          ))}
        </motion.section>
      </main>
    </div>
  );
};

export default LandingPage;
