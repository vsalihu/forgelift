import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { FirstPlaceIcon, SuccessIcon } from "../icons/featureIcons.jsx";
import { DeloadIcon, MissionsIcon, OverloadIcon, RecoveryIcon } from "../icons/navIcons.jsx";
import { formatClock, formatNumber, recordLabels, recordUnit } from "./gymUtils.js";

const EASE = [0.16, 1, 0.3, 1];
const rankSrc = (rank) => `/ranks/${String(rank).toLowerCase()}.png`;

const CountUp = ({ value, prefix = "", suffix = "", delay = 0 }) => {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value || 0, { duration: 1.2, delay, ease: EASE, onUpdate: setDisplay });
    return () => controls.stop();
  }, [value, delay, reduce]);

  return (
    <span className="tabular-nums">
      {prefix}
      {formatNumber(display, 0)}
      {suffix}
    </span>
  );
};

// Sparks that drift up behind the headline.
const Sparks = () => {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        left: `${6 + ((index * 37) % 88)}%`,
        size: 2 + (index % 3),
        delay: (index % 8) * 0.35,
        duration: 3.2 + (index % 5) * 0.5
      })),
    []
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
      {sparks.map((spark, index) => (
        <motion.span
          animate={{ y: [-10, -260], opacity: [0, 1, 0] }}
          className="absolute bottom-0 rounded-full bg-orange-300 shadow-[0_0_10px_2px_rgba(251,146,60,0.7)]"
          key={index}
          style={{ left: spark.left, width: spark.size, height: spark.size }}
          transition={{ duration: spark.duration, delay: spark.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const Panel = ({ icon: Icon, title, tone = "neutral", children, delay = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 ${tone === "ember" ? "border-forge-ember/25 bg-forge-ember/[0.06]" : tone === "warn" ? "border-amber-300/20 bg-amber-300/[0.05]" : "border-white/[0.08] bg-white/[0.03]"}`}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
        <Icon className={`h-4 w-4 ${tone === "warn" ? "text-amber-300" : "text-orange-300"}`} />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
};

const groupRecords = (records = []) => {
  const groups = new Map();
  records.forEach((record) => {
    const list = groups.get(record.exerciseName) || [];
    list.push(record);
    groups.set(record.exerciseName, list);
  });
  return [...groups.entries()];
};

const recordText = (record) =>
  record.recordType === "best_reps_at_weight"
    ? `${record.value} reps at ${formatNumber(record.weight)}kg`
    : `${formatNumber(record.value)}${recordUnit(record.recordType)}`;

const SessionSummary = ({ analysis, title, durationSeconds, detailsHref, startLabel = "Start another", onStartAnother }) => {
  const reduce = useReducedMotion();
  useBodyScrollLock(true);

  const promotions = analysis?.rankPromotions || [];
  const overall = promotions.find((promotion) => promotion.type === "overall");
  const musclePromotions = promotions.filter((promotion) => promotion.type === "muscle");
  const prGroups = groupRecords(analysis?.newPersonalRecords);
  const missions = analysis?.newlyCompletedMissions || [];
  const nextUp = (analysis?.overloadRecommendations || []).slice(0, 2);
  const deload = analysis?.deloadSummary?.[0];
  const muscles = analysis?.mainMusclesWorked || [];
  const recovery = (analysis?.recoverySummary || []).filter((item) => item.score !== null && item.score !== undefined).slice(0, 4);

  const stats = [
    { label: "Volume", value: analysis?.totalVolume, suffix: "kg" },
    { label: "Sets", value: analysis?.totalSets },
    { label: "Reps", value: analysis?.totalReps },
    { label: "XP earned", value: analysis?.xpEarned, prefix: "+" }
  ];

  return (
    <div aria-labelledby="session-summary-title" aria-modal="true" className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#07080a]" role="dialog">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,115,22,0.28),transparent_70%)]" />
      {reduce ? null : <Sparks />}

      <div className="relative mx-auto max-w-xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))] sm:px-6">
        <div className="text-center">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_60px_-10px_rgba(52,211,153,0.7)]"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <SuccessIcon className="h-10 w-10" />
          </motion.div>
          <motion.div animate={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: 14 }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Workout saved</p>
            <h1 className="font-display mt-2 text-[2.6rem] leading-none text-white sm:text-6xl" id="session-summary-title">
              Session forged.
            </h1>
            <p className="mt-3 break-words text-sm text-zinc-400">
              {title}
              {durationSeconds ? ` · ${formatClock(durationSeconds)}` : ""}
            </p>
          </motion.div>
        </div>

        <motion.dl
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-2 gap-2.5"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
        >
          {stats.map((stat, index) => (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4" key={stat.label}>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{stat.label}</dt>
              <dd className="font-display mt-1.5 text-3xl text-white">
                <CountUp delay={0.3 + index * 0.08} prefix={stat.prefix} suffix={stat.suffix} value={stat.value || 0} />
              </dd>
            </div>
          ))}
        </motion.dl>

        <div className="mt-4 space-y-3">
          {overall ? (
            <motion.section
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl border border-forge-ember/40 bg-gradient-to-br from-forge-ember/20 to-transparent p-5"
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
            >
              <div className="flex items-center gap-4">
                <img alt="" className="h-20 w-20 shrink-0 object-contain drop-shadow-[0_10px_30px_rgba(249,115,22,0.6)]" height="80" src={rankSrc(overall.newRank)} width="80" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Rank up</p>
                  <p className="font-display mt-1 text-2xl text-white">You reached {overall.newRank}</p>
                  <p className="mt-1 text-sm text-zinc-400">Up from {overall.oldRank}.</p>
                </div>
              </div>
            </motion.section>
          ) : null}

          {prGroups.length ? (
            <Panel delay={0.5} icon={FirstPlaceIcon} title={`New personal records · ${analysis.newPersonalRecords.length}`} tone="ember">
              <ul className="space-y-3">
                {prGroups.slice(0, 5).map(([exerciseName, records]) => (
                  <li key={exerciseName}>
                    <p className="font-bold text-white">{exerciseName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {records.map((record) => (
                        <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-orange-100" key={`${record.recordType}-${record.weight}-${record.value}`}>
                          {recordLabels[record.recordType] || "Record"}: {recordText(record)}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {musclePromotions.length ? (
            <Panel delay={0.55} icon={FirstPlaceIcon} title="Muscle ranks up">
              <ul className="grid gap-2 sm:grid-cols-2">
                {musclePromotions.slice(0, 6).map((promotion) => (
                  <li className="flex items-center gap-3 rounded-2xl bg-black/20 p-2.5" key={promotion.muscleGroup}>
                    <img alt="" className="h-9 w-9 object-contain" height="36" src={rankSrc(promotion.newRank)} width="36" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">{promotion.muscleGroup}</span>
                      <span className="block text-xs text-zinc-400">{promotion.oldRank} to {promotion.newRank}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {missions.length ? (
            <Panel delay={0.6} icon={MissionsIcon} title="Missions complete">
              <ul className="space-y-2">
                {missions.map((mission) => (
                  <li className="flex items-center justify-between gap-3 text-sm" key={mission._id || mission.title}>
                    <span className="font-semibold text-white">{mission.title}</span>
                    {mission.xpReward ? <span className="shrink-0 font-bold text-orange-300">+{mission.xpReward} XP</span> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {muscles.length || recovery.length ? (
            <Panel delay={0.62} icon={RecoveryIcon} title="Muscles worked">
              {muscles.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {muscles.map((muscle) => (
                    <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-sm font-semibold text-orange-100" key={muscle}>
                      {muscle}
                    </span>
                  ))}
                </div>
              ) : null}
              {recovery.length ? (
                <ul className={`grid gap-2 sm:grid-cols-2 ${muscles.length ? "mt-4" : ""}`}>
                  {recovery.map((item) => (
                    <li className="rounded-2xl bg-black/20 p-3" key={item.muscleGroup}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-bold text-white">{item.muscleGroup}</span>
                        <span className="shrink-0 font-bold tabular-nums text-zinc-300">{Math.round(item.score)}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className={`h-full rounded-full ${item.score >= 75 ? "bg-emerald-400" : item.score >= 50 ? "bg-amber-300" : "bg-red-400"}`} style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }} />
                      </div>
                      {item.restRecommendationHours ? <p className="mt-1.5 text-xs text-zinc-500">Ready for heavy work in about {item.restRecommendationHours}h</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          ) : null}

          {nextUp.length ? (
            <Panel delay={0.65} icon={OverloadIcon} title="Next time">
              <ul className="space-y-3">
                {nextUp.map((item) => (
                  <li key={item.exerciseName}>
                    <p className="text-sm font-bold text-white">
                      {item.exerciseName}
                      {item.recommendedWeight ? <span className="text-orange-300"> · {formatNumber(item.recommendedWeight)}kg</span> : null}
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-zinc-400">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {deload ? (
            <Panel delay={0.7} icon={DeloadIcon} title="Recovery check" tone="warn">
              <p className="text-sm leading-6 text-amber-100">{deload.reason}</p>
            </Panel>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/[0.06] bg-[#07080a]/85 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <button
            className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={onStartAnother}
          >
            {startLabel}
          </button>
          <Link
            className="flex min-h-12 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_34px_-12px_rgba(249,115,22,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            to="/dashboard"
          >
            Done
          </Link>
        </div>
        <p className="mx-auto mt-2 max-w-xl text-center text-xs text-zinc-500">
          <Link className="font-semibold text-zinc-400 underline-offset-2 hover:text-white hover:underline" to={detailsHref || "/workouts"}>
            {detailsHref ? "View full workout analysis" : "View in workout history"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SessionSummary;
