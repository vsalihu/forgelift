import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { DeloadWeekIcon, PhysioIcon, RestDayIcon, SuccessIcon } from "../icons/featureIcons.jsx";
import { EASE, ExampleNote, Reveal } from "./shared.jsx";

const panel = "rounded-3xl border border-white/[0.08] bg-[#0e1014]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const LogScene = () => {
  const reduce = useReducedMotion();
  const sets = [
    { n: 1, weight: "80 kg", reps: 8, done: true },
    { n: 2, weight: "80 kg", reps: 8, done: true },
    { n: 3, weight: "82.5 kg", reps: 7, done: false }
  ];
  return (
    <div className="grid w-full gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className={`${panel} p-5`}>
        <p className="text-lg font-bold text-white">Bench Press</p>
        <p className="text-sm text-zinc-400">Set 3 of 4</p>
        <ul className="mt-5 space-y-2">
          {sets.map((set, index) => (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                set.done ? "bg-white/[0.04]" : "border border-forge-ember/50 bg-forge-ember/10 shadow-[0_0_30px_-8px_rgba(249,115,22,0.6)]"
              }`}
              initial={reduce ? false : { opacity: 0, x: -14 }}
              key={set.n}
              transition={{ delay: 0.1 + index * 0.12, duration: 0.6, ease: EASE }}
            >
              <span className="text-sm text-zinc-400">Set {set.n}</span>
              <span className="font-bold tabular-nums text-white">
                {set.weight} x {set.reps}
              </span>
              {set.done ? (
                <SuccessIcon className="h-5 w-5 text-forge-ember" />
              ) : (
                <span className="text-xs font-bold text-orange-300">+2.5 kg</span>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
      <div className={`${panel} flex flex-col items-center p-5`}>
        <div className="relative h-28 w-28">
          <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" fill="none" r="50" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
            <motion.circle
              animate={{ pathLength: 0.62 }}
              cx="60"
              cy="60"
              fill="none"
              initial={reduce ? false : { pathLength: 1 }}
              r="50"
              stroke="#f97316"
              strokeLinecap="round"
              strokeWidth="8"
              style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" }}
              transition={{ duration: 1.6, ease: EASE }}
            />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums text-white">1:12</p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Rest timer</p>
      </div>
    </div>
  );
};

const RECOVERY = [
  { muscle: "Chest", img: "chest", value: 34, state: "Recovering" },
  { muscle: "Quads", img: "quads", value: 91, state: "Ready" },
  { muscle: "Lats", img: "lats", value: 68, state: "Recovering" },
  { muscle: "Side delts", img: "side-delts", value: 100, state: "Ready" }
];

const RecoverScene = () => {
  const reduce = useReducedMotion();
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {RECOVERY.map((item, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={`${panel} flex flex-col items-center p-4`}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          key={item.muscle}
          transition={{ delay: index * 0.08, duration: 0.6, ease: EASE }}
        >
          <div className="relative h-24 w-24">
            <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="46" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <motion.circle
                animate={{ pathLength: item.value / 100 }}
                cx="50"
                cy="50"
                fill="none"
                initial={reduce ? false : { pathLength: 0 }}
                r="46"
                stroke={item.state === "Ready" ? "#fb923c" : "rgba(249,115,22,0.45)"}
                strokeLinecap="round"
                strokeWidth="4"
                transition={{ delay: 0.2 + index * 0.08, duration: 1.2, ease: EASE }}
              />
            </svg>
            <img alt="" className="absolute inset-3 h-[4.5rem] w-[4.5rem] object-contain" height="160" src={`/muscles/${item.img}.png`} width="160" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">{item.muscle}</p>
          <p className={`text-xs tabular-nums ${item.state === "Ready" ? "text-orange-300" : "text-zinc-400"}`}>
            {item.value}% {item.state.toLowerCase()}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKS = [
  ["Push", "Pull", "Legs", "rest", "Upper", "Lower", "rest"],
  ["Push", "Pull", "physio", "Legs", "Upper", "rest", "rest"],
  ["Push", "Pull", "Legs", "rest", "Upper", "rest", "rest"]
];

const PlanScene = () => {
  const reduce = useReducedMotion();
  return (
    <div className={`${panel} w-full p-5`}>
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1.5 text-center sm:gap-2">
        <span />
        {DAYS.map((day, index) => (
          <span className="pb-1 text-xs font-bold text-zinc-500" key={`${day}-${index}`}>
            {day}
          </span>
        ))}
        {WEEKS.map((week, weekIndex) => (
          <div className="contents" key={weekIndex}>
            <span className="flex items-center gap-1 text-left text-xs font-bold text-zinc-400">
              {weekIndex === 2 ? <DeloadWeekIcon className="h-3.5 w-3.5 shrink-0 text-orange-300" /> : null}
              Wk {weekIndex + 1}
            </span>
            {week.map((day, dayIndex) => (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className={`flex aspect-square items-center justify-center rounded-xl text-[10px] font-bold sm:text-xs ${
                  day === "rest"
                    ? "bg-white/[0.03] text-zinc-500"
                    : day === "physio"
                      ? "bg-white/[0.06] text-orange-200"
                      : weekIndex === 2
                        ? "border border-dashed border-forge-ember/50 text-orange-200"
                        : "bg-forge-ember/15 text-orange-100"
                }`}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                key={dayIndex}
                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.025, duration: 0.45, ease: EASE }}
              >
                {day === "rest" ? (
                  <RestDayIcon aria-label="Rest" className="h-3.5 w-3.5" role="img" />
                ) : day === "physio" ? (
                  <PhysioIcon aria-label="Treatment" className="h-3.5 w-3.5" role="img" />
                ) : (
                  <span className="hidden sm:inline">{day}</span>
                )}
              </motion.span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
        <DeloadWeekIcon className="h-4 w-4 text-orange-300" />
        Week 3 is a lighter deload week
      </p>
    </div>
  );
};

const HISTORY = "M20 190 L70 176 L120 168 L170 150 L220 141 L270 122";
const PROJECTION = "M270 122 L320 108 L370 96 L420 86";
const BAND = "M270 122 L320 98 L370 78 L420 62 L420 108 L370 112 L320 117 L270 122 Z";

const ProgressScene = () => {
  const reduce = useReducedMotion();
  return (
    <div className={`${panel} w-full p-5`}>
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold text-white">Squat</p>
        <p className="text-sm tabular-nums text-zinc-400">Estimated 1RM</p>
      </div>
      <svg aria-label="Squat strength rising toward a 100 kg goal" className="mt-4 h-auto w-full" role="img" viewBox="0 0 440 210">
        <line stroke="rgba(255,255,255,0.05)" x1="20" x2="430" y1="190" y2="190" />
        <line stroke="rgba(253,230,138,0.5)" strokeDasharray="4 6" x1="20" x2="430" y1="70" y2="70" />
        <text fill="#fde68a" fontSize="12" fontWeight="700" x="24" y="62">
          Goal 100 kg
        </text>
        <motion.path animate={{ opacity: 1 }} d={BAND} fill="rgba(249,115,22,0.12)" initial={reduce ? false : { opacity: 0 }} transition={{ delay: 1.1, duration: 0.8 }} />
        <motion.path
          animate={{ pathLength: 1 }}
          d={HISTORY}
          fill="none"
          initial={reduce ? false : { pathLength: 0 }}
          stroke="#fb923c"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.6))" }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <motion.path
          animate={{ pathLength: 1 }}
          d={PROJECTION}
          fill="none"
          initial={reduce ? false : { pathLength: 0 }}
          stroke="#fde68a"
          strokeDasharray="6 7"
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{ delay: 1, duration: 0.9, ease: EASE }}
        />
        <circle cx="270" cy="122" fill="#fb923c" r="5" />
      </svg>
      <p className="mt-2 text-sm text-zinc-400">
        On this pace you reach <span className="font-bold text-white">100 kg in about 9 weeks</span>.
      </p>
    </div>
  );
};

const STEPS = [
  {
    title: "Log the set",
    body: "Gym Mode is made for one hand mid-set: rest timers, last session's numbers and a suggested weight for the next set.",
    Scene: LogScene
  },
  {
    title: "Recovery, per muscle",
    body: "Every muscle gets its own recovery score, scaled to how heavy the work was compared with your PRs.",
    Scene: RecoverScene
  },
  {
    title: "Weeks planned ahead",
    body: "Mark rest and treatment days on the calendar. ForgeLift plans the next three to four weeks around them, deloads included.",
    Scene: PlanScene
  },
  {
    title: "See where it's heading",
    body: "Projections show where each lift is going and roughly when you'll reach your goal.",
    Scene: ProgressScene
  }
];

// Mobile: remount the scene when it scrolls into view so its entrance animation is seen.
const SceneOnView = ({ Scene }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  return (
    <div className={`transition-opacity duration-500 ${inView ? "opacity-100" : "opacity-0"}`} ref={ref}>
      <Scene key={inView ? "shown" : "waiting"} />
    </div>
  );
};

const CoachStory = () => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const ActiveScene = STEPS[active].Scene;

  return (
    <section className="relative scroll-mt-24 py-24 sm:py-32" id="how">
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-1/3 -z-10 h-[40rem] w-[40rem] -translate-x-1/3 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.1),transparent_65%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="font-display [text-wrap:balance] text-4xl leading-[1.05] text-white sm:text-5xl">A coach that reads every set.</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-400">Four things happen each time you train. You only do the first one.</p>
        </Reveal>

        <div className="mt-12 lg:mt-6 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="hidden lg:block">
            <div className="sticky top-28 flex h-[min(calc(100dvh-9rem),38rem)] flex-col justify-center">
              <div className="relative">
                <div aria-hidden="true" className="absolute inset-[10%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.22),transparent_65%)] blur-2xl" />
                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                    initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
                    key={active}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <ActiveScene />
                  </motion.div>
                </AnimatePresence>
              </div>
              <ExampleNote className="mt-5" />
            </div>
          </div>

          <ol className="space-y-16 lg:space-y-0">
            {STEPS.map((step, index) => (
              <motion.li
                className="lg:flex lg:min-h-[min(calc(100dvh-9rem),38rem)] lg:items-center"
                key={step.title}
                onViewportEnter={() => setActive(index)}
                viewport={{ amount: 0.6 }}
              >
                <div className="w-full">
                  <div className="flex items-center gap-4">
                    <span
                      className={`h-px flex-1 max-w-[3rem] transition-colors duration-500 ${active === index ? "bg-forge-ember" : "bg-white/15"}`}
                      aria-hidden="true"
                    />
                    <h3 className={`text-2xl font-bold transition-colors duration-500 sm:text-3xl ${active === index ? "text-white" : "text-zinc-400 lg:text-zinc-500"}`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-4 max-w-md text-lg leading-8 text-zinc-400">{step.body}</p>
                  <div className="mt-8 lg:hidden">
                    <SceneOnView Scene={step.Scene} />
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
          <ExampleNote className="mt-6 lg:hidden" />
        </div>
      </div>
    </section>
  );
};

export default CoachStory;
