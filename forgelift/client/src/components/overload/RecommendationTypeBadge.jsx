const labels = {
  increase_weight: "Increase Weight",
  repeat_weight: "Repeat Weight",
  reduce_weight: "Reduce Weight",
  increase_reps: "Increase Reps",
  reduce_volume: "Reduce Volume",
  recovery_warning: "Recovery Warning",
  plateau_warning: "Plateau Warning",
  deload_flag: "Deload Flag"
};

const styles = {
  increase_weight: "bg-green-500/10 text-green-200",
  repeat_weight: "bg-blue-500/10 text-blue-200",
  reduce_weight: "bg-orange-500/10 text-orange-200",
  increase_reps: "bg-forge-ember/15 text-orange-200",
  reduce_volume: "bg-yellow-500/10 text-yellow-200",
  recovery_warning: "bg-red-500/10 text-red-200",
  plateau_warning: "bg-purple-500/10 text-purple-200",
  deload_flag: "bg-red-600/15 text-red-100"
};

const RecommendationTypeBadge = ({ type }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[type] || "bg-white/10 text-slate-200"}`}>
    {labels[type] || type?.replaceAll("_", " ") || "Recommendation"}
  </span>
);

export default RecommendationTypeBadge;
