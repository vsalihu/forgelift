import { motion } from "framer-motion";
import { X } from "lucide-react";
import Button from "../Button.jsx";
import RankBadge from "./RankBadge.jsx";

const RankPromotionModal = ({ promotions = [], xpEarned = 0, onClose }) => {
  if (!promotions.length) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4">
      <motion.div
        className="w-full max-w-2xl rounded-lg border border-forge-copper/50 bg-forge-panel p-6 shadow-metal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-forge-copper">Rank Promotion</p>
            <h2 className="mt-2 text-3xl font-black text-white">Progress forged</h2>
            <p className="mt-2 text-sm text-slate-400">+{xpEarned} XP earned from this workout.</p>
          </div>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {promotions.map((promotion, index) => (
            <motion.div
              className="rounded-lg border border-white/10 bg-black/25 p-4"
              key={`${promotion.type}-${promotion.muscleGroup || "overall"}-${index}`}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <p className="mb-3 font-bold text-white">
                {promotion.type === "overall" ? "Overall Rank" : `${promotion.muscleGroup} Rank`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <RankBadge rank={promotion.oldRank} />
                <span className="text-slate-400">to</span>
                <RankBadge rank={promotion.newRank} />
              </div>
              <p className="mt-3 text-sm text-slate-300">{promotion.message}</p>
            </motion.div>
          ))}
        </div>

        <Button className="mt-6 w-full" onClick={onClose}>
          Continue
        </Button>
      </motion.div>
    </div>
  );
};

export default RankPromotionModal;
