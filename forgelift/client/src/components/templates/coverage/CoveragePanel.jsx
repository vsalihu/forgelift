import { Check, ChevronDown, ChevronRight } from "lucide-react";
import BodyMap from "./BodyMap.jsx";
import CoverageMeter, { STATUS_TEXT } from "./CoverageMeter.jsx";
import { fillStatus } from "../../../utils/muscleMap.js";

const pct = (value) => `${Math.round(value * 100)}%`;

// Coverage for the muscles a workout targets: overall score, body map, and a meter per muscle part.
const CoveragePanel = ({ coverage, groupIds, experience, onOpenPart, onChangeTargets, onFillNext, onFillAll, busy, hasExercises, compact = false }) => {
  const parts = coverage.groups.flatMap((group) => group.parts);
  const open = parts.filter((part) => part.fill < 0.9);
  const over = parts.filter((part) => part.status.key === "over");
  const overallStatus = fillStatus(coverage.overall);

  return (
    <section aria-labelledby="coverage-heading" className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg text-white" id="coverage-heading">
            Muscle coverage
          </h2>
          <button className="mt-0.5 text-left text-sm font-semibold text-orange-300 hover:text-orange-200" type="button" onClick={onChangeTargets}>
            {coverage.groups.map((group) => group.label).join(" · ")} <span className="text-zinc-500">· Change</span>
          </button>
        </div>
        <p className="text-right">
          <span className="font-display block text-3xl leading-none tabular-nums text-white">{pct(coverage.overall)}</span>
          <span className={`text-xs font-semibold ${STATUS_TEXT[overallStatus.key]}`}>covered</span>
        </p>
      </div>
      <div className="mt-3">
        <CoverageMeter fill={coverage.overall} size="lg" status={coverage.overall >= 0.9 ? "hit" : overallStatus.key} />
      </div>
      <p aria-live="polite" className="mt-2 text-sm text-zinc-400">
        {open.length
          ? `${open.length} part${open.length === 1 ? "" : "s"} still need${open.length === 1 ? "s" : ""} work. Tap one to see what trains it.`
          : "Every part is covered. Nice session."}
        {over.length ? ` ${over.map((part) => part.label).join(", ")} ${over.length === 1 ? "is" : "are"} getting more than needed.` : ""}
      </p>

      {compact ? (
        <details className="group mt-3 rounded-2xl border border-white/[0.06]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-zinc-300 [&::-webkit-details-marker]:hidden">
            Show on the body map
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2 pb-3">
            <BodyMap fills={coverage.allFills} groupIds={groupIds} onOpenPart={onOpenPart} />
          </div>
        </details>
      ) : (
        <div className="mt-4">
          <BodyMap fills={coverage.allFills} groupIds={groupIds} onOpenPart={onOpenPart} />
        </div>
      )}

      <div className="mt-5 space-y-5">
        {coverage.groups.map((group) => (
          <section aria-label={`${group.label}, ${pct(group.fill)} covered`} key={group.id}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-white">
                <img alt="" className="h-7 w-7 object-contain" src={`/muscles/${group.image}.png`} />
                {group.label}
              </h3>
              <span className="text-sm font-bold tabular-nums text-zinc-300">{pct(group.fill)}</span>
            </div>
            <ul className="space-y-1">
              {group.parts.map((part) => (
                <li key={part.id}>
                  <button
                    aria-label={`${part.label}: ${part.status.label}, ${pct(part.fill)} of target. Show exercises.`}
                    className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    type="button"
                    onClick={() => onOpenPart(part.id)}
                  >
                    <span className="truncate text-sm text-zinc-200">{part.label}</span>
                    <span className={`flex items-center gap-1 text-xs font-bold ${STATUS_TEXT[part.status.key]}`}>
                      {part.status.key === "hit" ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                      {part.status.label}
                      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="col-span-2">
                      <CoverageMeter fill={part.fill} status={part.status.key} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {open.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <button
            className="min-h-11 rounded-full border border-forge-ember/40 bg-forge-ember/10 px-4 text-sm font-bold text-orange-100 transition-colors hover:bg-forge-ember/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
            disabled={busy}
            type="button"
            onClick={onFillNext}
          >
            Fill the next gap
          </button>
          <button
            className="min-h-11 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
            disabled={busy}
            type="button"
            onClick={onFillAll}
          >
            {hasExercises ? "Fill every gap" : "Build it for me"}
          </button>
        </div>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Targets are set for {experience ? experience.toLowerCase() : "intermediate"} lifters. One exercise fills at most 60% of a part, so each needs some variety.
      </p>
    </section>
  );
};

export default CoveragePanel;
