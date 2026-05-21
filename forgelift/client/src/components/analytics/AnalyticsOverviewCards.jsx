const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const AnalyticsOverviewCards = ({ overview }) => {
  const cards = [
    ["Workouts", overview?.totalWorkouts || 0],
    ["Total volume", `${formatNumber(overview?.totalVolume)} kg`],
    ["PRs", overview?.totalPRs || 0],
    ["Missions completed", overview?.missionsCompleted || 0],
    ["Average RPE", overview?.averageSessionRPE || "-"],
    ["Active deloads", overview?.activeDeloads || 0]
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, value]) => (
        <div className="metal-panel rounded-lg p-4" key={label}>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
      ))}
    </section>
  );
};

export default AnalyticsOverviewCards;
