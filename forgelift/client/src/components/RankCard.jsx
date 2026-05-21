import { Award } from "lucide-react";
import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar.jsx";

const RankCard = ({ rank = "Copper", xp = 0 }) => {
  return (
    <motion.div
      className="rounded-lg border border-forge-copper/40 bg-gradient-to-br from-forge-copper/25 via-forge-panel to-black/70 p-6 shadow-metal"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forge-copper">
            Overall Rank
          </p>
          <h2 className="mt-2 text-4xl font-black text-white">{rank}</h2>
        </div>
        <div className="rounded-full border border-forge-copper/50 bg-black/30 p-4">
          <Award className="h-9 w-9 text-forge-copper" />
        </div>
      </div>
      <ProgressBar label="Next rank target" value={0} />
      <p className="mt-4 text-sm text-slate-300">{xp} XP earned</p>
    </motion.div>
  );
};

export default RankCard;
