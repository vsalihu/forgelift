// Small circle with your current leaderboard place. Top 3 get a gold ring.
const PlaceBadge = ({ place, className = "" }) => {
  if (!place) return null;
  const podium = place <= 3;

  return (
    <span
      aria-label={`Leaderboard place ${place}`}
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-black leading-none ${
        podium ? "bg-amber-300 text-black ring-2 ring-amber-500/50" : "bg-white text-forge-black"
      } ${className}`}
    >
      {place > 99 ? "99+" : place}
    </span>
  );
};

export default PlaceBadge;
