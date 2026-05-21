const MissionProgressBar = ({ value = 0 }) => {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-forge-copper to-forge-ember"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
};

export default MissionProgressBar;
