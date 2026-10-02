import StatTile from "./StatTile.jsx";

const compact = (value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

const AnalyticsOverviewCards = ({ overview, unit = "kg" }) => {
  const cards = [
    ["Workouts", overview?.totalWorkouts || 0],
    ["Total volume", `${compact(overview?.totalVolume)} ${unit}`],
    ["PRs", overview?.totalPRs || 0],
    ["Missions done", overview?.missionsCompleted || 0],
    ["Average effort", overview?.averageSessionRPE ? `RPE ${overview.averageSessionRPE}` : "–"],
    ["Deloads running", overview?.activeDeloads || 0]
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, value]) => (
        <StatTile key={label} label={label} value={value} />
      ))}
    </div>
  );
};

export default AnalyticsOverviewCards;
