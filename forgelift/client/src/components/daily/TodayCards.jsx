import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Pencil, Plus } from "lucide-react";
import { InfoIcon, MacroIcon, MealIcon, SleepIcon, SuccessIcon, SupplementIcon, WaterDropIcon } from "../icons/featureIcons.jsx";
import { formatHours, waterUnits } from "../../utils/dailyUtils.js";

export const Card = ({ icon: Icon, title, meta, children, className = "" }) => (
  <section className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5 ${className}`}>
    <header className="mb-4 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-gradient-to-b from-orange-400/15 to-forge-ember/5 text-orange-200">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="min-w-0 flex-1 font-bold text-white">{title}</h2>
      {meta ? <div className="shrink-0 text-right text-sm tabular-nums text-zinc-400">{meta}</div> : null}
    </header>
    {children}
  </section>
);

const Tick = ({ done, label, onClick }) => (
  <button
    aria-label={done ? `${label}: done` : `Mark ${label.toLowerCase()} as done`}
    aria-pressed={done}
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-90 ${
      done ? "border-transparent bg-gradient-to-b from-emerald-300 to-emerald-500 text-[#04140d]" : "border-white/15 bg-white/[0.03] text-zinc-500 hover:border-orange-400/50 hover:text-orange-200"
    }`}
    type="button"
    onClick={onClick}
  >
    <Check aria-hidden="true" className="h-5 w-5" strokeWidth={done ? 3 : 2} />
  </button>
);

const Bar = ({ value, target, done }) => {
  const reduce = useReducedMotion();
  const ratio = target ? Math.min(1, value / target) : 0;
  return (
    <span aria-hidden="true" className="block h-2 overflow-clip rounded-full bg-white/[0.07]">
      <motion.span
        animate={{ width: `${ratio * 100}%` }}
        className={`block h-full rounded-full ${done ? "bg-gradient-to-r from-emerald-300 to-emerald-500" : "bg-gradient-to-r from-orange-300 to-forge-ember"}`}
        initial={false}
        transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
};

const chip =
  "inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-bold tabular-nums text-zinc-200 transition-colors hover:border-orange-400/40 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-95";

const MACRO_STEPS = { protein: [10, 25], carbs: [25, 50], fat: [5, 10] };

export const MacroCard = ({ plan, totals, todos, onSet, onEdit }) => {
  const kcal = Math.round(totals.protein * 4 + totals.carbs * 4 + totals.fat * 9);
  return (
    <Card
      icon={MacroIcon}
      meta={
        <>
          <span className="font-bold text-white">{kcal.toLocaleString("en-US")}</span> / {plan.macros.calories.toLocaleString("en-US")} kcal
        </>
      }
      title="Macros"
    >
      <ul className="space-y-4">
        {todos
          .filter((todo) => todo.kind === "macro")
          .map((todo) => (
            <li className="flex items-start gap-3" key={todo.key}>
              <Tick done={todo.done} label={`${todo.label} target`} onClick={() => (todo.done ? onEdit(todo.key) : onSet(todo.key, todo.target))} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-white">
                    {todo.label}
                    {todo.done ? <span className="ml-2 text-xs font-bold text-emerald-300">Hit</span> : null}
                  </span>
                  <button
                    aria-label={`Edit ${todo.label.toLowerCase()}: ${Math.round(todo.value)} of ${todo.target} grams`}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2 text-sm tabular-nums text-zinc-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    type="button"
                    onClick={() => onEdit(todo.key)}
                  >
                    <span className="font-bold text-white">{Math.round(todo.value)}</span> / {todo.target} g
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                </div>
                <div className="mt-2">
                  <Bar done={todo.done} target={todo.target} value={todo.value} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MACRO_STEPS[todo.key].map((step) => (
                    <button aria-label={`Add ${step} grams of ${todo.label.toLowerCase()}`} className={chip} key={step} type="button" onClick={() => onSet(todo.key, todo.value + step)}>
                      <Plus aria-hidden="true" className="h-3 w-3" />
                      {step} g
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-zinc-500">Tick a target when you've hit it, or add as you eat. Ticked meals and whey count automatically.</p>
    </Card>
  );
};

const Glass = ({ ratio }) => {
  const reduce = useReducedMotion();
  const fill = Math.min(1, ratio);
  return (
    <svg aria-hidden="true" className="h-28 w-20 shrink-0" viewBox="0 0 80 112">
      <defs>
        <clipPath id="glass-clip">
          <path d="M8 6h64l-7 98a6 6 0 0 1-6 5H21a6 6 0 0 1-6-5L8 6z" />
        </clipPath>
        <linearGradient id="water-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <g clipPath="url(#glass-clip)">
        <rect fill="rgba(255,255,255,0.04)" height="112" width="80" />
        <motion.g animate={{ y: 112 - fill * 106 }} initial={false} transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <motion.path
            animate={reduce ? undefined : { x: [0, -40] }}
            d="M0 4 Q10 0 20 4 T40 4 T60 4 T80 4 T100 4 T120 4 V120 H0 Z"
            fill="url(#water-fill)"
            opacity="0.9"
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
      </g>
      <path d="M8 6h64l-7 98a6 6 0 0 1-6 5H21a6 6 0 0 1-6-5L8 6z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
    </svg>
  );
};

export const WaterCard = ({ todo, imperial, onSet, onEdit }) => {
  const units = waterUnits(imperial);
  return (
    <Card
      icon={WaterDropIcon}
      meta={
        <>
          <span className="font-bold text-white">{units.format(todo.value)}</span> / {units.format(todo.target)}
        </>
      }
      title="Water"
    >
      <div className="flex items-center gap-4">
        <Glass ratio={todo.target ? todo.value / todo.target : 0} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className={`text-sm font-semibold ${todo.done ? "text-emerald-300" : "text-zinc-300"}`}>
            {todo.done ? "Hydration done for today." : `${units.format(Math.max(0, todo.target - todo.value))} to go`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button className={chip} type="button" onClick={() => onSet(todo.value + units.glassMl)}>
              <Plus aria-hidden="true" className="h-3 w-3" />
              Glass · {units.glassLabel}
            </button>
            <button className={chip} type="button" onClick={() => onSet(todo.value + units.glassMl * 2)}>
              <Plus aria-hidden="true" className="h-3 w-3" />
              Bottle · {imperial ? "16 oz" : "500 ml"}
            </button>
            <button aria-label="Edit water" className={chip} type="button" onClick={onEdit}>
              <Pencil aria-hidden="true" className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const MealsCard = ({ plan, log, onToggle }) => {
  const meals = Array.from({ length: plan.meals.count }, (_, index) => Boolean(log?.meals?.[index]?.done));
  const done = meals.filter(Boolean).length;
  return (
    <Card
      icon={MealIcon}
      meta={
        <>
          <span className="font-bold text-white">{done}</span> / {plan.meals.count}
        </>
      }
      title="Meals"
    >
      <div className={`grid gap-2 ${plan.meals.count >= 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        {meals.map((isDone, index) => (
          <button
            aria-label={`Meal ${index + 1}${plan.macros ? `, about ${plan.meals.protein} grams of protein` : ""}`}
            aria-pressed={isDone}
            className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] ${
              isDone ? "border-emerald-400/30 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-white/[0.02] hover:border-orange-400/30"
            }`}
            key={index}
            type="button"
            onClick={() => onToggle(index)}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isDone ? "bg-emerald-400 text-[#04140d]" : "border border-white/15 text-zinc-500"}`}>
              {isDone ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">Meal {index + 1}</span>
              {plan.macros ? <span className="block text-xs tabular-nums text-zinc-400">~{plan.meals.protein} g protein</span> : null}
            </span>
          </button>
        ))}
      </div>
      {plan.macros ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Each meal: about {plan.meals.protein} g protein, {plan.meals.carbs} g carbs, {plan.meals.fat} g fat. Ticking one adds that to your macros.
        </p>
      ) : null}
    </Card>
  );
};

export const SupplementsCard = ({ plan, log, onSetDoses }) => (
  <Card icon={SupplementIcon} title="Supplements">
    <ul className="space-y-3">
      {plan.supplements.map((supplement) => {
        const taken = Math.min(supplement.doses, Number(log?.supplements?.[supplement.key]) || 0);
        const done = taken >= supplement.doses;
        return (
          <li className={`rounded-2xl border p-3 ${done ? "border-emerald-400/25 bg-emerald-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"}`} key={supplement.key}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-white">
                  {supplement.label}
                  {supplement.phase === "loading" ? (
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-orange-200">
                      Loading {supplement.loadingDay}/{supplement.loadingDays}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm tabular-nums text-zinc-300">
                  {supplement.doses > 1 ? `${supplement.doses} × ${supplement.doseLabel}` : supplement.doseLabel} · <span className="text-zinc-400">{supplement.timing}</span>
                </p>
                {supplement.note ? <p className="mt-1.5 text-xs leading-5 text-zinc-500">{supplement.note}</p> : null}
              </div>
              {supplement.doses > 1 ? null : <Tick done={done} label={supplement.label} onClick={() => onSetDoses(supplement.key, done ? 0 : 1)} />}
            </div>
            {supplement.doses > 1 ? (
              <div aria-label={`${supplement.label} doses`} className="mt-3 flex flex-wrap gap-1.5" role="group">
                {Array.from({ length: supplement.doses }, (_, index) => {
                  const on = index < taken;
                  return (
                    <button
                      aria-label={`Dose ${index + 1} of ${supplement.doses}${on ? ", taken" : ""}`}
                      aria-pressed={on}
                      className={`flex h-10 min-w-[4.5rem] items-center justify-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-90 ${
                        on ? "border-transparent bg-emerald-400 text-[#04140d]" : "border-white/15 text-zinc-500 hover:border-orange-400/50"
                      }`}
                      key={index}
                      type="button"
                      onClick={() => onSetDoses(supplement.key, on && index === taken - 1 ? index : index + 1)}
                    >
                      {on ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : null}
                      Dose {index + 1}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
    <p className="mt-3 text-xs leading-5 text-zinc-500">General guidance, not medical advice. Follow the label.</p>
  </Card>
);

export const SleepCard = ({ plan, onCheckIn }) => {
  const { sleep } = plan;
  const tone = sleep.status === "good" ? "text-emerald-300" : sleep.status === "short" ? "text-amber-300" : "text-zinc-300";
  const statusText = { good: "On target", close: "A little short", short: "Short night", unknown: "" }[sleep.status];
  return (
    <Card icon={SleepIcon} title="Sleep">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <p className="text-xs font-semibold text-zinc-500">Last night</p>
          {sleep.lastNight !== null ? (
            <>
              <p className="font-display mt-1 text-2xl tabular-nums text-white">{formatHours(sleep.lastNight)}</p>
              <p className={`text-xs font-bold ${tone}`}>{statusText}</p>
            </>
          ) : (
            <button className="mt-1 inline-flex min-h-10 items-center text-sm font-bold text-orange-300 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onCheckIn}>
              Log it in the check-in
            </button>
          )}
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <p className="text-xs font-semibold text-zinc-500">Tonight, aim for</p>
          <p className="font-display mt-1 text-2xl tabular-nums text-white">{formatHours(sleep.targetTonight)}</p>
          {sleep.status === "short" ? <p className="text-xs font-bold text-orange-200">Half an hour extra to catch up</p> : null}
        </div>
      </div>
    </Card>
  );
};

const TIP_TONE = {
  warn: ["border-amber-400/25 bg-amber-500/[0.07]", "text-amber-300", InfoIcon],
  good: ["border-emerald-400/25 bg-emerald-500/[0.06]", "text-emerald-300", SuccessIcon],
  info: ["border-white/[0.08] bg-white/[0.03]", "text-orange-200", InfoIcon]
};

export const TipsList = ({ tips }) =>
  tips.length ? (
    <ul className="space-y-2">
      {tips.map((tip) => {
        const [box, iconTone, Icon] = TIP_TONE[tip.tone] || TIP_TONE.info;
        return (
          <li className={`flex items-start gap-3 rounded-2xl border p-3.5 text-sm leading-6 text-zinc-200 ${box}`} key={tip.key}>
            <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
            {tip.text}
          </li>
        );
      })}
    </ul>
  ) : null;

export const ReasonsCard = ({ reasons, waterLabel }) =>
  reasons.length ? (
    <details className="group rounded-3xl border border-white/[0.08] bg-white/[0.02]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-bold text-white [&::-webkit-details-marker]:hidden">
        Why these numbers
        <ChevronDown aria-hidden="true" className="h-5 w-5 text-zinc-500 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="space-y-4 px-5 pb-5">
        {reasons.map((reason) => (
          <div key={reason.key}>
            <dt className="text-sm font-bold text-orange-200">{reason.key === "water" ? `Water ${waterLabel}` : reason.title}</dt>
            <dd className="mt-1 text-sm leading-6 text-zinc-400">{reason.text}</dd>
          </div>
        ))}
        <p className="text-xs leading-5 text-zinc-500">General guidance for healthy adults, not medical advice.</p>
      </dl>
    </details>
  ) : null;
