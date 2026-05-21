const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const ReportStatGrid = ({ report }) => {
  const stats = [
    ["Workouts", report?.totalWorkouts || 0],
    ["Volume", `${formatNumber(report?.totalVolume)} kg`],
    ["PRs", report?.totalPRs || 0],
    ["Missions", report?.missionsCompleted || 0],
    ["Strongest", report?.strongestArea || "-"],
    ["Weakest", report?.weakestArea || "-"]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(([label, value]) => (
        <div className="rounded-md bg-black/25 p-4" key={label}>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-xl font-black text-white">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default ReportStatGrid;
