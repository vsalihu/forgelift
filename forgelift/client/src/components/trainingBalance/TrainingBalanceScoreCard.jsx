import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";
import ProgressRing from "../visuals/ProgressRing.jsx";

const statusStyles = {
  Excellent: "text-green-200",
  Good: "text-yellow-200",
  "Needs Work": "text-orange-200",
  Poor: "text-red-200"
};

const TrainingBalanceScoreCard = ({ trainingBalance }) => {
  const hasScore = trainingBalance?.score !== null && trainingBalance?.score !== undefined && trainingBalance?.minimumDataMet !== false;

  return (
    <section className="rounded-lg border border-forge-copper/40 bg-gradient-to-br from-forge-copper/20 via-forge-panel to-black/70 p-6 shadow-metal">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Training Balance</p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-5xl font-black text-white">{hasScore ? `${trainingBalance.score}/100` : "Not ready"}</h1>
          <p className={`mt-2 text-xl font-bold ${statusStyles[trainingBalance?.status] || "text-slate-200"}`}>
            {trainingBalance?.status || "Needs Work"}
          </p>
        </div>
        {hasScore ? (
          <ProgressRing
            label="Balance"
            size={132}
            value={trainingBalance?.score || 0}
            variant={(trainingBalance?.score || 0) >= 85 ? "success" : (trainingBalance?.score || 0) >= 70 ? "warning" : "danger"}
          />
        ) : null}
      </div>
      <div className="mt-6">
        {hasScore ? (
          <AnimatedProgressBar
            label="Balance score"
            value={trainingBalance?.score || 0}
            variant={(trainingBalance?.score || 0) >= 85 ? "success" : (trainingBalance?.score || 0) >= 70 ? "warning" : "danger"}
          />
        ) : (
          <p className="rounded-md bg-black/25 p-4 text-sm text-slate-300">
            Log at least 3 workouts across 2 or more muscle groups before ForgeLift calculates a meaningful training balance score.
          </p>
        )}
      </div>
    </section>
  );
};

export default TrainingBalanceScoreCard;
