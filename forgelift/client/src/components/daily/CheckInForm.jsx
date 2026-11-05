import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { GymModeIcon } from "../icons/navIcons.jsx";
import { SleepIcon } from "../icons/featureIcons.jsx";
import { formatHours } from "../../utils/dailyUtils.js";

const SLEEP_CHIPS = [5, 6, 7, 8, 9];
const ENERGY = [
  [1, "Drained"],
  [2, "Low"],
  [3, "OK"],
  [4, "Good"],
  [5, "Great"]
];
const SOURCE_HINT = {
  logged: "You've logged a workout today",
  planned: "Planned in your calendar",
  rest: "Rest day in your calendar"
};

const Label = ({ children, htmlFor, id }) => (
  <p className="mb-2.5 text-sm font-semibold text-zinc-300" id={id}>
    {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : children}
  </p>
);

const pill = (active) =>
  `min-h-11 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    active ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
  }`;

// Sleep, training, energy and an optional morning weight. Values: { sleepHours, trainingToday, energy, morningWeight }.
const CheckInForm = ({ values, onChange, detected, weightUnit, idPrefix = "checkin" }) => {
  const reduce = useReducedMotion();
  const [showWeight, setShowWeight] = useState(Boolean(values.morningWeight));
  const set = (patch) => onChange({ ...values, ...patch });
  const sleep = values.sleepHours ?? 7.5;
  const step = (delta) => set({ sleepHours: Math.min(14, Math.max(0, Math.round((sleep + delta) * 2) / 2)) });

  return (
    <div className="space-y-6">
      <section aria-labelledby={`${idPrefix}-sleep`}>
        <Label id={`${idPrefix}-sleep`}>How long did you sleep?</Label>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-3">
            <button aria-label="Half an hour less" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => step(-0.5)}>
              <Minus aria-hidden="true" className="h-5 w-5" />
            </button>
            <p aria-live="polite" className="flex items-center gap-2.5 text-center">
              <SleepIcon aria-hidden="true" className="h-6 w-6 text-orange-300" />
              <span className="font-display whitespace-nowrap text-3xl tabular-nums text-white">{formatHours(sleep, { compact: true })}</span>
            </p>
            <button aria-label="Half an hour more" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => step(0.5)}>
              <Plus aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {SLEEP_CHIPS.map((hours) => (
              <button aria-pressed={sleep === hours} className={`${pill(sleep === hours)} px-0`} key={hours} type="button" onClick={() => set({ sleepHours: hours })}>
                {hours} h
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby={`${idPrefix}-training`}>
        <Label id={`${idPrefix}-training`}>Training today?</Label>
        <div className="grid grid-cols-2 gap-2">
          <button aria-pressed={values.trainingToday === true} className={`${pill(values.trainingToday === true)} inline-flex items-center justify-center gap-2`} type="button" onClick={() => set({ trainingToday: true })}>
            <GymModeIcon aria-hidden="true" className="h-4 w-4" />
            Training day
          </button>
          <button aria-pressed={values.trainingToday === false} className={pill(values.trainingToday === false)} type="button" onClick={() => set({ trainingToday: false })}>
            Rest day
          </button>
        </div>
        {detected && SOURCE_HINT[detected] ? <p className="mt-2 text-xs text-zinc-500">{SOURCE_HINT[detected]}.</p> : null}
      </section>

      <section aria-labelledby={`${idPrefix}-energy`}>
        <Label id={`${idPrefix}-energy`}>Energy right now</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {ENERGY.map(([level, label]) => (
            <button
              aria-pressed={values.energy === level}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                values.energy === level ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
              }`}
              key={level}
              type="button"
              onClick={() => set({ energy: values.energy === level ? null : level })}
            >
              <span aria-hidden="true" className="flex items-end gap-0.5">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span className={`w-1 rounded-full ${bar <= level ? (values.energy === level ? "bg-[#160a02]" : "bg-orange-300/80") : values.energy === level ? "bg-[#160a02]/25" : "bg-white/15"}`} key={bar} style={{ height: 3 + bar * 2 }} />
                ))}
              </span>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        {showWeight ? (
          <motion.div animate={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: -6 }}>
              <Label htmlFor={`${idPrefix}-weight`}>Morning weight ({weightUnit}), optional</Label>
              <input
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
                id={`${idPrefix}-weight`}
                inputMode="decimal"
                placeholder={weightUnit === "lb" ? "e.g. 181.4" : "e.g. 82.4"}
                value={values.morningWeight ?? ""}
                onChange={(event) => set({ morningWeight: event.target.value.replace(",", ".").replace(/[^\d.]/g, "") })}
              />
          </motion.div>
        ) : (
          <button className="inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-bold text-orange-300 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => setShowWeight(true)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add morning weight
          </button>
        )}
      </section>
    </div>
  );
};

export default CheckInForm;
