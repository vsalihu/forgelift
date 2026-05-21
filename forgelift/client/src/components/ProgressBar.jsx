const ProgressBar = ({ value = 0, label }) => {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{boundedValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-copper to-forge-ember"
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
