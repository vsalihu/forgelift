import { motion } from "framer-motion";
import { CheckCircle2, Flame } from "lucide-react";
import Button from "../Button.jsx";

const MissionCompleteAnimation = ({ missions = [], onClose }) => {
  if (!missions.length) return null;
  const totalXp = missions.reduce((sum, mission) => sum + (Number(mission.xpReward) || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4">
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-emerald-400/30 bg-forge-panel p-6 text-center shadow-2xl shadow-emerald-950/30"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22 }}
      >
        <motion.div
          animate={{ scale: [0.9, 1.08, 1] }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200"
          transition={{ duration: 0.35 }}
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <h2 className="mt-4 text-2xl font-black text-white">
          {missions.length === 1 ? "Mission Complete" : `${missions.length} Missions Complete`}
        </h2>
        <div className="mt-4 space-y-2">
          {missions.map((mission) => (
            <div className="rounded-lg bg-black/25 p-3 text-sm text-slate-200" key={mission._id || mission.title}>
              {mission.title}
            </div>
          ))}
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-forge-ember/15 px-4 py-2 font-black text-orange-100">
          <Flame className="h-4 w-4" />
          +{totalXp} XP
        </p>
        <Button className="mt-5 w-full" type="button" onClick={onClose}>
          Continue
        </Button>
      </motion.div>
    </div>
  );
};

export default MissionCompleteAnimation;
