import { RefreshCw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import Button from "../Button.jsx";
import ConfirmModal from "../ui/ConfirmModal.jsx";

const formatDate = (date) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));

const PlanPanel = ({ planStatus, busy, onGenerateClick, onRegenerateRemainder, onCancelPlan }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!planStatus) return null;

  const { activePlan, readiness } = planStatus;

  if (activePlan) {
    const { adherence } = activePlan;
    return (
      <section className="metal-panel mb-5 rounded-xl border-forge-copper/30 p-5">
        {confirmCancel ? (
          <ConfirmModal
            title="Cancel this plan?"
            description="Future planned days from this plan will be cleared. Days already completed stay in your history."
            confirmLabel="Cancel plan"
            onCancel={() => setConfirmCancel(false)}
            onConfirm={() => {
              setConfirmCancel(false);
              onCancelPlan();
            }}
          />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-forge-copper">Active training plan</p>
            <p className="mt-1 text-lg font-black text-white">{activePlan.splitSummary}</p>
            <p className="mt-1 text-sm text-slate-400">
              {formatDate(activePlan.startDate)} - {formatDate(activePlan.endDate)} ({activePlan.durationWeeks} weeks)
            </p>
          </div>
          <div className="flex gap-2">
            <Button disabled={busy} type="button" variant="secondary" onClick={onRegenerateRemainder}>
              <RefreshCw className="h-4 w-4" />
              Regenerate remainder
            </Button>
            <Button disabled={busy} type="button" variant="ghost" onClick={() => setConfirmCancel(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-bold text-white">Plan adherence</span>
            <span className="text-slate-400">
              {adherence.completed}/{adherence.total} days · {adherence.percentage}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-forge-ember transition-all" style={{ width: `${adherence.percentage}%` }} />
          </div>
          {adherence.missed ? (
            <p className="mt-2 text-xs text-slate-500">{adherence.missed} missed so far · keep going.</p>
          ) : null}
        </div>
      </section>
    );
  }

  const { unlocked, daysLogged, daysNeeded, workoutDaysLogged, workoutDaysNeeded } = readiness || {};

  if (unlocked) {
    return (
      <section className="metal-panel mb-5 rounded-xl border-forge-copper/40 p-5 text-center">
        <Sparkles className="mx-auto mb-2 h-7 w-7 text-forge-copper" />
        <p className="text-lg font-black text-white">Ready to generate your plan</p>
        <p className="mt-1 text-sm text-slate-400">
          ForgeLift has enough training history to build your next few weeks.
        </p>
        <Button className="mt-4" type="button" onClick={onGenerateClick}>
          <Sparkles className="h-4 w-4" />
          Generate Plan
        </Button>
      </section>
    );
  }

  const dayProgress = daysNeeded ? Math.min(100, Math.round(((daysLogged || 0) / daysNeeded) * 100)) : 0;
  const workoutProgress = workoutDaysNeeded ? Math.min(100, Math.round(((workoutDaysLogged || 0) / workoutDaysNeeded) * 100)) : 0;

  return (
    <section className="metal-panel mb-5 rounded-xl p-5">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-forge-copper">Plan generator</p>
      <p className="mt-1 text-lg font-black text-white">Keep logging to unlock plan generation</p>
      <p className="mt-1 text-sm text-slate-400">
        ForgeLift needs a bit more history to understand your training pattern before it can build a smart plan.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Days since your first workout</span>
            <span>{daysLogged || 0}/{daysNeeded}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-forge-copper" style={{ width: `${dayProgress}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Workout days logged</span>
            <span>{workoutDaysLogged || 0}/{workoutDaysNeeded}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-forge-copper" style={{ width: `${workoutProgress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanPanel;
