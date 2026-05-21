const styles = {
  Low: "border-slate-400/40 bg-slate-900/50 text-slate-200",
  Medium: "border-yellow-400/40 bg-yellow-950/30 text-yellow-200",
  High: "border-orange-400/40 bg-orange-950/30 text-orange-200",
  Critical: "border-red-400/50 bg-red-950/40 text-red-200"
};

const SeverityBadge = ({ severity = "Low" }) => {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${styles[severity] || styles.Low}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
