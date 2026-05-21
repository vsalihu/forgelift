const styles = {
  High: "bg-green-500/10 text-green-200",
  Medium: "bg-yellow-500/10 text-yellow-200",
  Low: "bg-white/10 text-slate-300"
};

const ConfidenceBadge = ({ confidence }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[confidence] || styles.Low}`}>
    {confidence || "Low"} confidence
  </span>
);

export default ConfidenceBadge;
