import { motion, useReducedMotion } from "framer-motion";
import { FlameIcon } from "../icons/featureIcons.jsx";
import { formatShortDate } from "./missionMeta.js";

const EASE = [0.16, 1, 0.3, 1];
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const daysLeft = (weekEnd) => {
  if (!weekEnd) return null;
  const days = Math.ceil((new Date(weekEnd).getTime() - Date.now()) / 86400000);
  if (days <= 0) return "Last day";
  return `${days} ${days === 1 ? "day" : "days"} left`;
};

const WeekRing = ({ done, target }) => {
  const reduce = useReducedMotion();
  const size = 132;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, done / Math.max(1, target));
  const complete = ratio >= 1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div aria-hidden="true" className={`absolute inset-5 rounded-full blur-2xl ${complete ? "bg-emerald-400/30" : "bg-forge-ember/30"}`} />
      <svg aria-hidden="true" className="relative -rotate-90" height={size} width={size}>
        <circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={reduce ? false : { strokeDashoffset: circumference }}
          r={radius}
          stroke={complete ? "#34d399" : "url(#week-ring)"}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={stroke}
          transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
        />
        <defs>
          <linearGradient id="week-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#b87333" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl leading-none tabular-nums text-white">
          {done}
          <span className="text-xl text-zinc-500">/{target}</span>
        </span>
        <span className="mt-1 text-xs font-semibold text-zinc-400">workouts</span>
      </div>
    </div>
  );
};

const Stat = ({ label, value, hint }) => (
  <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
    <dt className="truncate text-xs text-zinc-500">{label}</dt>
    <dd className="font-display mt-0.5 text-2xl tabular-nums text-white">{value}</dd>
    {hint ? <dd className="truncate text-xs text-zinc-500">{hint}</dd> : null}
  </div>
);

const WeekHero = ({ weeklyTarget, xpEarned, xpAvailable, missionStreak, weekStreak, completedCount = 0, activeCount = 0 }) => {
  const reduce = useReducedMotion();
  const done = weeklyTarget?.completedWorkouts || 0;
  const target = weeklyTarget?.targetWorkouts || 0;
  const volumeRatio = weeklyTarget?.targetVolume ? Math.min(100, Math.round(((weeklyTarget.completedVolume || 0) / weeklyTarget.targetVolume) * 100)) : 0;
  const completedMuscles = weeklyTarget?.completedMuscleGroups || [];

  return (
    <section
      className="relative overflow-clip rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-forge-ember/[0.1] via-white/[0.02] to-transparent p-5 sm:p-7"
      data-tour-id="missions-weekly-target"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-forge-ember/15 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          {weeklyTarget ? (
            <div className="flex items-center gap-5">
              <WeekRing done={done} target={Math.max(target, 1)} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">
                  {formatShortDate(weeklyTarget.weekStart)} – {formatShortDate(weeklyTarget.weekEnd)}
                </p>
                <h2 className="font-display mt-1 text-2xl leading-tight text-white sm:text-3xl">
                  {done >= target && target ? "Weekly target hit." : `${Math.max(0, target - done)} to go this week`}
                </h2>
                {daysLeft(weeklyTarget.weekEnd) ? <p className="mt-1 text-sm text-zinc-400">{daysLeft(weeklyTarget.weekEnd)}</p> : null}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl text-white">No weekly target yet</h2>
              <p className="mt-1 text-sm text-zinc-400">Recalculate to build this week's plan from your training.</p>
            </div>
          )}

          {weeklyTarget?.targetVolume ? (
            <div className="mt-6">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-zinc-300">Volume</span>
                <span className="tabular-nums text-zinc-500">
                  <span className="font-bold text-zinc-100">{formatNumber(weeklyTarget.completedVolume)}</span> / {formatNumber(weeklyTarget.targetVolume)}kg
                </span>
              </div>
              <div aria-label={`Weekly volume ${volumeRatio}% of target`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={volumeRatio} className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
                <motion.div
                  animate={{ width: `${volumeRatio}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300"
                  initial={reduce ? false : { width: 0 }}
                  transition={{ duration: 1, delay: 0.25, ease: EASE }}
                />
              </div>
            </div>
          ) : null}

          {weeklyTarget?.targetMuscleGroups?.length ? (
            <div className="mt-5">
              <p className="text-sm text-zinc-300">Muscles to hit</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {weeklyTarget.targetMuscleGroups.map((muscle) => {
                  const hit = completedMuscles.includes(muscle);
                  return (
                    <li
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-emerald-500/15 text-emerald-200" : "border border-white/10 text-zinc-300"}`}
                      key={muscle}
                    >
                      {hit ? <span aria-hidden="true">✓ </span> : null}
                      {muscle}
                      <span className="sr-only">{hit ? ", trained" : ", not trained yet"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
          <Stat hint={`${formatNumber(xpAvailable)} XP still open`} label="XP earned this week" value={<span className="inline-flex items-center gap-1.5"><FlameIcon aria-hidden="true" className="h-5 w-5 text-orange-300" />{formatNumber(xpEarned)}</span>} />
          <Stat hint={`Best ${missionStreak?.bestCount || 0}`} label="Mission streak" value={missionStreak?.currentCount || 0} />
          <Stat hint={`Best ${weekStreak?.bestCount || 0}`} label="Weekly target streak" value={weekStreak?.currentCount || 0} />
          <Stat hint="this week" label="Missions done" value={`${completedCount}/${completedCount + activeCount}`} />
        </dl>
      </div>
    </section>
  );
};

export default WeekHero;
