import { Shield } from "lucide-react";

export const rankStyles = {
  Copper: "border-orange-700/60 bg-gradient-to-r from-orange-950/70 to-orange-800/20 text-orange-300 shadow-orange-950/30",
  Bronze: "border-amber-700/60 bg-gradient-to-r from-amber-950/70 to-amber-800/20 text-amber-300 shadow-amber-950/30",
  Silver: "border-slate-500/60 bg-gradient-to-r from-slate-800/70 to-slate-600/20 text-slate-100 shadow-slate-950/30",
  Gold: "border-yellow-500/60 bg-gradient-to-r from-yellow-950/70 to-yellow-500/20 text-yellow-200 shadow-yellow-950/30",
  Platinum: "border-cyan-400/60 bg-gradient-to-r from-cyan-950/70 to-cyan-400/20 text-cyan-100 shadow-cyan-950/30",
  Diamond: "border-sky-400/60 bg-gradient-to-r from-sky-950/70 to-sky-400/20 text-sky-200 shadow-sky-950/30",
  Elite: "border-violet-400/60 bg-gradient-to-r from-violet-950/70 to-violet-400/20 text-violet-200 shadow-violet-950/30",
  Warrior: "border-red-400/60 bg-gradient-to-r from-red-950/70 to-red-500/20 text-red-200 shadow-red-950/30",
  Ultimate: "border-white/70 bg-gradient-to-r from-white/20 to-forge-ember/20 text-white shadow-white/10"
};

const RankBadge = ({ rank = "Copper", className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] shadow-lg ${
        rankStyles[rank] || rankStyles.Copper
      } ${className}`}
    >
      <Shield className="h-3.5 w-3.5" />
      {rank}
    </span>
  );
};

export default RankBadge;
