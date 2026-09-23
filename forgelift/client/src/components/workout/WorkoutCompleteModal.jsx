import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../Button.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const WorkoutCompleteModal = ({ open, analysis, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4">
      <motion.div
        className="relative w-full max-w-md rounded-lg border border-forge-copper/50 bg-forge-panel p-6 text-center shadow-metal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
      >
        <button
          className="absolute right-4 top-4 rounded-md p-2 text-slate-300 hover:bg-white/10"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="mt-4 text-2xl font-black text-white">Workout completed!</h2>
        <p className="mt-2 text-sm text-slate-400">Nice work. Your progress has been saved.</p>

        {analysis ? (
          <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-black/25 p-3">
              <p className="text-slate-400">XP</p>
              <p className="mt-1 font-black text-white">+{formatNumber(analysis.xpEarned)}</p>
            </div>
            <div className="rounded-md bg-black/25 p-3">
              <p className="text-slate-400">Volume</p>
              <p className="mt-1 font-black text-white">{formatNumber(analysis.totalVolume)}kg</p>
            </div>
            <div className="rounded-md bg-black/25 p-3">
              <p className="text-slate-400">Sets</p>
              <p className="mt-1 font-black text-white">{formatNumber(analysis.totalSets)}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            to="/workouts"
          >
            Workout History
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            to="/dashboard"
          >
            Home Screen
          </Link>
        </div>
        <Button className="mt-3 w-full" type="button" variant="ghost" onClick={onClose}>
          Keep reviewing
        </Button>
      </motion.div>
    </div>
  );
};

export default WorkoutCompleteModal;
