const styles = {
  Low: "bg-white/10 text-slate-300",
  Medium: "bg-yellow-500/10 text-yellow-200",
  High: "bg-orange-500/10 text-orange-200",
  Critical: "bg-red-500/10 text-red-200"
};

const MissionPriorityBadge = ({ priority }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[priority] || styles.Medium}`}>
    {priority || "Medium"} priority
  </span>
);

export default MissionPriorityBadge;
