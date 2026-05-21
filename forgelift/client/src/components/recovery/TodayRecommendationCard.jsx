import { Activity } from "lucide-react";

const TodayRecommendationCard = ({ recommendation }) => {
  return (
    <section className="rounded-lg border border-forge-copper/40 bg-gradient-to-br from-forge-copper/20 via-forge-panel to-black/70 p-6 shadow-metal">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Today</p>
          <h2 className="mt-2 text-3xl font-black text-white">{recommendation?.bestWorkoutType || "Any Workout"}</h2>
        </div>
        <div className="rounded-full border border-forge-copper/50 bg-black/30 p-4 text-forge-ember">
          <Activity className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-bold text-white">Best muscles to train</p>
          <div className="flex flex-wrap gap-2">
            {(recommendation?.bestMusclesToTrain || []).map((muscle) => (
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-200" key={muscle}>
                {muscle}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-white">Muscles to avoid</p>
          <div className="flex flex-wrap gap-2">
            {(recommendation?.musclesToAvoid || []).map((muscle) => (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200" key={muscle}>
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {recommendation?.missingGroups?.length || recommendation?.undertrainedGroups?.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {recommendation?.missingGroups?.length ? (
            <div>
              <p className="mb-2 text-sm font-bold text-white">Missing this week</p>
              <div className="flex flex-wrap gap-2">
                {recommendation.missingGroups.map((group) => (
                  <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-sm font-semibold capitalize text-orange-200" key={group}>
                    {group}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {recommendation?.undertrainedGroups?.length ? (
            <div>
              <p className="mb-2 text-sm font-bold text-white">Undertrained</p>
              <div className="flex flex-wrap gap-2">
                {recommendation.undertrainedGroups.map((group) => (
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold capitalize text-blue-200" key={group}>
                    {group}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-5 space-y-2 text-sm text-slate-300">
        {(recommendation?.reasons || []).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
};

export default TodayRecommendationCard;
