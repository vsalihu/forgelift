import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import { CalendarIcon } from "../icons/navIcons.jsx";

const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const Bar = ({ label, value, max }) => {
  const percent = max ? Math.min(100, Math.round(((value || 0) / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="tabular-nums text-zinc-300">
          {value || 0}/{max}
        </span>
      </div>
      <div aria-label={`${label}: ${value || 0} of ${max}`} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value || 0} className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
        <div className="h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const shell = "relative mb-6 overflow-clip rounded-[2rem] border p-5 sm:p-6";

const PlanPanel = ({ planStatus, busy, onGenerateClick, onRegenerateRemainder, onCancelPlan }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!planStatus) return null;
  const { activePlan, readiness } = planStatus;

  if (activePlan) {
    const { adherence = {} } = activePlan;
    return (
      <section aria-labelledby="plan-title" className={`${shell} border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.1] via-white/[0.02] to-transparent`}>
        {confirmCancel ? (
          <ConfirmModal
            confirmLabel="Cancel plan"
            description="Future planned days from this plan are cleared. Days you've already done stay in your history."
            title="Cancel this plan?"
            onCancel={() => setConfirmCancel(false)}
            onConfirm={() => {
              setConfirmCancel(false);
              onCancelPlan();
            }}
          />
        ) : null}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-orange-300">
              Your plan · {formatDate(activePlan.startDate)} – {formatDate(activePlan.endDate)}
            </p>
            <h2 className="font-display mt-1 text-2xl leading-tight text-white sm:text-3xl" id="plan-title">
              {activePlan.splitSummary || `${activePlan.durationWeeks}-week plan`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onRegenerateRemainder}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Rebuild the rest
            </button>
            <button
              aria-label="Cancel plan"
              className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={() => setConfirmCancel(true)}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-5 max-w-xl">
          <Bar label="Plan days done" max={adherence.total || 0} value={adherence.completed} />
          <p className="mt-2 text-sm text-zinc-500">
            {adherence.percentage ?? 0}% on track{adherence.missed ? ` · ${adherence.missed} missed, keep going` : ""}
          </p>
        </div>
      </section>
    );
  }

  const { unlocked, daysLogged, daysNeeded, workoutDaysLogged, workoutDaysNeeded } = readiness || {};

  if (unlocked) {
    return (
      <section className={`${shell} border-forge-ember/30 bg-gradient-to-br from-forge-ember/[0.12] via-white/[0.02] to-transparent`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forge-ember/15 text-orange-200">
              <CalendarIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-tight text-white">Your plan is ready to build.</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">ForgeLift has learned your training pattern and can schedule the next few weeks for you.</p>
            </div>
          </div>
          <button
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_34px_-12px_rgba(249,115,22,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={onGenerateClick}
          >
            Build my plan
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`${shell} border-white/[0.08] bg-white/[0.025]`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-orange-300">Plan builder</p>
          <h2 className="font-display mt-1 text-2xl leading-tight text-white">Keep logging to unlock your plan.</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">A little more history and ForgeLift can schedule your next few weeks around how you actually train.</p>
        </div>
        <div className="space-y-4">
          <Bar label="Days since your first workout" max={daysNeeded || 0} value={daysLogged} />
          <Bar label="Workout days logged" max={workoutDaysNeeded || 0} value={workoutDaysLogged} />
        </div>
      </div>
    </section>
  );
};

export default PlanPanel;
