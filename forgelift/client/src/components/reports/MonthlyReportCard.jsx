const MonthlyReportCard = ({ report, onSelect }) => (
  <button
    className="w-full rounded-md border border-white/10 bg-black/20 p-4 text-left transition hover:border-forge-copper/60"
    type="button"
    onClick={() => onSelect?.(report)}
  >
    <p className="font-bold text-white">{report.title}</p>
    <p className="mt-2 text-sm text-slate-400">
      {report.totalWorkouts} workouts / {report.totalPRs} PRs / {report.missionsCompleted} missions
    </p>
  </button>
);

export default MonthlyReportCard;
