import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import CheckInForm from "./CheckInForm.jsx";
import DailyModalShell from "./DailyModalShell.jsx";
import { checkInBody, checkInDefaults } from "./DailyCheckInModal.jsx";

const GOALS = [
  ["cut", "Lose fat", "Moderate deficit, high protein to keep your muscle."],
  ["maintain", "Maintain", "Eat to perform and recover at your current weight."],
  ["gain", "Build muscle", "Small surplus so most of the gain is muscle."]
];
const SUPPLEMENT_HINTS = {
  creatine: "Strength and power",
  whey: "Counts toward protein",
  vitamin_d: "Daily, with food",
  omega3: "Daily, with food",
  magnesium: "Evenings",
  multivitamin: "With breakfast",
  caffeine: "Training days only",
  electrolytes: "Training days only"
};
const SUPPLEMENT_ORDER = ["creatine", "whey", "vitamin_d", "omega3", "magnesium", "multivitamin", "caffeine", "electrolytes"];
const SUPPLEMENT_LABELS = {
  creatine: "Creatine",
  whey: "Whey protein",
  vitamin_d: "Vitamin D",
  omega3: "Omega-3",
  magnesium: "Magnesium",
  multivitamin: "Multivitamin",
  caffeine: "Caffeine / pre-workout",
  electrolytes: "Electrolytes"
};

const choice = (active) =>
  `rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    active ? "border-orange-400/60 bg-orange-500/[0.12]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
  }`;
const pill = (active) =>
  `min-h-11 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    active ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
  }`;
const input = "min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60";
const decimal = (value) => value.replace(",", ".").replace(/[^\d.]/g, "");

const Check2 = ({ on }) => (
  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-transparent bg-orange-400 text-[#160a02]" : "border-white/20"}`}>
    {on ? <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} /> : null}
  </span>
);

// First-time setup (ends with today's check-in) or, with editing, the plan settings.
const DailySetupFlow = ({ data, user, editing = false, onSaveProfile, onSaveCheckIn, onSkip, onClose }) => {
  const reduce = useReducedMotion();
  const imperial = user?.preferredUnits === "imperial";
  const profile = data?.profile || {};
  const [form, setForm] = useState(() => ({
    goal: profile.goal || data?.plan?.inputs?.goal || "maintain",
    sex: profile.sex || (["male", "female"].includes(user?.gender) ? user.gender : ""),
    weight: user?.bodyweight ? String(user.bodyweight) : "",
    height: user?.height ? String(user.height) : "",
    age: user?.age ? String(user.age) : "",
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 3,
    mealsPerDay: profile.mealsPerDay ?? 4,
    sleepTargetHours: profile.sleepTargetHours ?? 8,
    supplements: profile.supplements || [],
    creatineMode: profile.creatineMode || "maintain"
  }));
  const [checkIn, setCheckIn] = useState(() => checkInDefaults(data));
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const steps = editing ? ["goal", "body", "week", "supplements"] : ["goal", "body", "week", "supplements", "today"];
  const current = steps[step];
  const last = step === steps.length - 1;
  const hasDob = Boolean(user?.dateOfBirth);

  const go = (delta) => {
    setError("");
    setDirection(delta);
    setStep((value) => Math.min(steps.length - 1, Math.max(0, value + delta)));
  };

  const next = async () => {
    if (current === "body" && !Number(form.weight)) {
      setError("Your weight is what the targets are built on.");
      return;
    }
    if (!last) {
      go(1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaveProfile({
        goal: form.goal,
        sex: form.sex,
        weight: form.weight,
        height: form.height,
        age: hasDob ? undefined : form.age,
        trainingDaysPerWeek: form.trainingDaysPerWeek,
        mealsPerDay: form.mealsPerDay,
        sleepTargetHours: form.sleepTargetHours,
        supplements: form.supplements,
        creatineMode: form.supplements.includes("creatine") ? form.creatineMode : ""
      });
      if (!editing) await onSaveCheckIn(checkInBody(checkIn));
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const toggleSupplement = (key) =>
    set({ supplements: form.supplements.includes(key) ? form.supplements.filter((item) => item !== key) : [...form.supplements, key] });

  const titles = {
    goal: ["What's the goal right now?", "Sets your calories and protein."],
    body: ["A few numbers", "Only used to work out your targets."],
    week: ["Your usual week", "Training days decide how much you need."],
    supplements: ["Anything you take?", "Each one becomes a daily to-do. Skip if none."],
    today: ["Last one: today", "So today's plan fits the day you're having."]
  };

  return (
    <DailyModalShell
      closeLabel={editing ? "Close plan settings" : "Skip setup for now"}
      footer={
        <div className="space-y-2">
          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            {step > 0 ? (
              <button aria-label="Back" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => go(-1)}>
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              </button>
            ) : null}
            <button
              className="min-h-12 flex-1 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_40px_-14px_rgba(249,115,22,0.95)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] disabled:opacity-60"
              disabled={saving}
              type="button"
              onClick={next}
            >
              {saving ? "Building your plan…" : last ? (editing ? "Save plan" : "Build my day") : "Next"}
            </button>
          </div>
          {!editing ? (
            <button className="mx-auto block min-h-10 px-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onSkip}>
              Skip for now. Set it up later from Today.
            </button>
          ) : null}
        </div>
      }
      header={
        <header className="mb-6 pr-10">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-orange-300">{editing ? "Plan settings" : "Your daily plan"}</p>
            <span className="text-xs font-semibold tabular-nums text-zinc-500">
              {step + 1} of {steps.length}
            </span>
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1">
            {steps.map((key, index) => (
              <span className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index <= step ? "bg-orange-400" : "bg-white/10"}`} key={key} />
            ))}
          </div>
          <h2 className="font-display mt-4 text-2xl leading-tight text-white" id="setup-title">
            {titles[current][0]}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">{titles[current][1]}</p>
        </header>
      }
      labelledBy="setup-title"
      onClose={editing ? onClose : onSkip}
    >
      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 * direction }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * direction }}
          key={current}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {current === "goal" ? (
            <div className="grid gap-2">
              {GOALS.map(([key, label, hint]) => (
                <button aria-pressed={form.goal === key} className={`${choice(form.goal === key)} flex items-center gap-3`} key={key} type="button" onClick={() => set({ goal: key })}>
                  <Check2 on={form.goal === key} />
                  <span>
                    <span className="block font-bold text-white">{label}</span>
                    <span className="mt-0.5 block text-sm text-zinc-400">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {current === "body" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300" htmlFor="setup-weight">
                  Weight ({imperial ? "lb" : "kg"})
                </label>
                <input className={input} id="setup-weight" inputMode="decimal" value={form.weight} onChange={(event) => set({ weight: decimal(event.target.value) })} />
              </div>
              <div className={`grid gap-3 ${hasDob ? "" : "grid-cols-2"}`}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300" htmlFor="setup-height">
                    Height ({imperial ? "in" : "cm"})
                  </label>
                  <input className={input} id="setup-height" inputMode="decimal" placeholder="Optional" value={form.height} onChange={(event) => set({ height: decimal(event.target.value) })} />
                </div>
                {hasDob ? null : (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-300" htmlFor="setup-age">
                      Age
                    </label>
                    <input className={input} id="setup-age" inputMode="numeric" placeholder="Optional" value={form.age} onChange={(event) => set({ age: event.target.value.replace(/\D/g, "").slice(0, 2) })} />
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300" id="setup-sex">
                  Calorie formula
                </p>
                <div aria-labelledby="setup-sex" className="grid grid-cols-3 gap-1.5" role="group">
                  {[
                    ["male", "Male"],
                    ["female", "Female"],
                    ["", "Skip"]
                  ].map(([key, label]) => (
                    <button aria-pressed={form.sex === key} className={pill(form.sex === key)} key={label} type="button" onClick={() => set({ sex: key })}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-5 text-zinc-500">Height, age and the formula sharpen your calories. Without them ForgeLift estimates from your weight.</p>
            </div>
          ) : null}

          {current === "week" ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300" id="setup-days">
                  Training days a week
                </p>
                <div aria-labelledby="setup-days" className="grid grid-cols-8 gap-1" role="group">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                    <button aria-pressed={form.trainingDaysPerWeek === days} className={`${pill(form.trainingDaysPerWeek === days)} px-0`} key={days} type="button" onClick={() => set({ trainingDaysPerWeek: days })}>
                      {days}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300" id="setup-meals">
                  Meals a day
                </p>
                <div aria-labelledby="setup-meals" className="grid grid-cols-5 gap-1.5" role="group">
                  {[2, 3, 4, 5, 6].map((meals) => (
                    <button aria-pressed={form.mealsPerDay === meals} className={pill(form.mealsPerDay === meals)} key={meals} type="button" onClick={() => set({ mealsPerDay: meals })}>
                      {meals}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Your protein gets split across these, so each meal has a clear target.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300" id="setup-sleep">
                  Sleep you aim for
                </p>
                <div aria-labelledby="setup-sleep" className="grid grid-cols-5 gap-1.5" role="group">
                  {[7, 7.5, 8, 8.5, 9].map((hours) => (
                    <button aria-pressed={form.sleepTargetHours === hours} className={`${pill(form.sleepTargetHours === hours)} px-0`} key={hours} type="button" onClick={() => set({ sleepTargetHours: hours })}>
                      {hours} h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {current === "supplements" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {SUPPLEMENT_ORDER.map((key) => {
                  const on = form.supplements.includes(key);
                  return (
                    <button aria-pressed={on} className={`${choice(on)} flex items-start gap-2.5 p-3`} key={key} type="button" onClick={() => toggleSupplement(key)}>
                      <Check2 on={on} />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-snug text-white">{SUPPLEMENT_LABELS[key]}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">{SUPPLEMENT_HINTS[key]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.supplements.includes("creatine") ? (
                <motion.div animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.06] p-3" initial={reduce ? false : { opacity: 0, y: 8 }}>
                  <p className="mb-2 text-sm font-semibold text-orange-100" id="setup-creatine">
                    Creatine
                  </p>
                  <div aria-labelledby="setup-creatine" className="grid gap-2" role="group">
                    {[
                      ["maintain", "Already taking it, or keep it simple", "3-5 g a day. Fully topped up in 3-4 weeks."],
                      ["load", "Start with a loading week", "About 20 g a day in 4 doses for 7 days, then 3-5 g. Topped up in a week."]
                    ].map(([key, label, hint]) => (
                      <button aria-pressed={form.creatineMode === key} className={`${choice(form.creatineMode === key)} flex items-start gap-2.5 p-3`} key={key} type="button" onClick={() => set({ creatineMode: key })}>
                        <Check2 on={form.creatineMode === key} />
                        <span>
                          <span className="block text-sm font-bold text-white">{label}</span>
                          <span className="mt-0.5 block text-xs text-zinc-400">{hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
              <p className="text-xs leading-5 text-zinc-500">General guidance for healthy adults, not medical advice. Check with a doctor if you have a condition or take medication.</p>
            </div>
          ) : null}

          {current === "today" ? <CheckInForm detected={data?.plan?.trainingSource} idPrefix="setup-checkin" values={checkIn} weightUnit={imperial ? "lb" : "kg"} onChange={setCheckIn} /> : null}
        </motion.div>
      </AnimatePresence>
    </DailyModalShell>
  );
};

export default DailySetupFlow;
