import { Activity, Flame, Gauge, Medal, Target, Trophy, Zap } from "lucide-react";
import Layout from "../components/Layout.jsx";
import RankCard from "../components/RankCard.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../hooks/useAuth.js";

const DashboardPage = () => {
  const { user } = useAuth();

  const cards = [
    { title: "Goal Path", value: user?.goalPath || "Not set", icon: Target },
    { title: "XP", value: "0", icon: Zap, note: "Progress engine coming soon" },
    { title: "Current Streak", value: "0 weeks", icon: Flame },
    { title: "Today's Recommendation", value: "Coming soon", icon: Activity },
    { title: "Recovery Readiness", value: "Coming soon", icon: Gauge },
    { title: "Weak Point Detector", value: "Coming soon", icon: Target },
    { title: "Latest PR", value: "Coming soon", icon: Medal },
    { title: "Training Balance Score", value: "Coming soon", icon: Trophy },
    { title: "Next Rank Target", value: "Coming soon", icon: Trophy },
    { title: "Smart Overload Engine", value: "Coming soon", icon: Zap }
  ];

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-iron-copper">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-white">Welcome, {user?.name}</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <RankCard rank="Copper" xp={0} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
