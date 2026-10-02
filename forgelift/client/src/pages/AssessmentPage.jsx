import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { ChipSelect, ChoiceGrid, Segmented } from "../components/auth/Choices.jsx";
import { cleanDecimal, cleanInteger } from "../components/gym/gymUtils.js";
import { GoalIcon, InfoIcon, SuccessIcon } from "../components/icons/featureIcons.jsx";
import { AssessmentIcon, BaselinesIcon } from "../components/icons/navIcons.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { assessmentService } from "../services/assessmentService.js";
import { goalPaths } from "../utils/onboarding.js";

const EASE = [0.16, 1, 0.3, 1];
const STEPS = ["Welcome", "Background", "Goal", "Lifts", "Limits", "Review"];
const mainLifts = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-up", "Hip Thrust", "Romanian Deadlift"];

const trainingHistoryOptions = [
  { value: "new", label: "No, I'm new" },
  { value: "less_than_6_months", label: "Yes, under 6 months" },
  { value: "six_to_eighteen_months", label: "Yes, 6 to 18 months" },
  { value: "eighteen_months_to_three_years", label: "Yes, 18 months to 3 years" },
  { value: "three_plus_years", label: "Yes, 3+ years" }
];
const weeklyOptions = [
  { value: "0", label: "0 days" },
  { value: "1_to_2", label: "1 to 2 days" },
  { value: "3_to_4", label: "3 to 4 days" },
  { value: "5_plus", label: "5+ days" }
];
const confidenceOptions = [
  { value: "not_confident", label: "Not confident" },
  { value: "somewhat_confident", label: "Somewhat confident" },
  { value: "confident", label: "Confident" },
  { value: "very_confident", label: "Very confident" }
];
const limitationOptions = ["Shoulders", "Lower back", "Knees", "Hips", "Wrists/elbows", "None"];
const styleOptions = ["Heavy strength work", "Muscle-building volume", "General fitness", "Fat loss/conditioning", "Unsure"];

const estimateOneRepMax = (weight, reps) => {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 10) / 10;
};
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const card = "rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01]";
const smallInput =
  "min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-center text-base font-bold tabular-nums text-white outline-none placeholder:font-normal placeholder:text-zinc-600 focus:border-forge-ember/60";

const Progress = ({ step }) => (
  <div className="mb-6" data-tour-id="assessment-progress">
    <ol aria-label="Assessment progress" className="grid grid-cols-6 gap-1.5">
      {STEPS.map((label, index) => (
        <li aria-current={index === step ? "step" : undefined} key={label}>
          <span className="block h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.span
              animate={{ scaleX: index <= step ? 1 : 0 }}
              className="block h-full origin-left rounded-full bg-gradient-to-r from-forge-copper to-orange-400"
              initial={false}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </span>
        </li>
      ))}
    </ol>
    <p className="mt-3 text-sm text-zinc-400">
      Step {step + 1} of {STEPS.length}: <span className="font-semibold text-zinc-200">{STEPS[step]}</span>
    </p>
  </div>
);

const LiftRow = ({ lift, unit, onChange }) => {
  const preview = estimateOneRepMax(lift.weight, lift.reps);
  return (
    <li className={`rounded-2xl border p-3 transition-colors ${lift.known ? "border-forge-ember/40 bg-forge-ember/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      <button aria-pressed={lift.known} className="flex min-h-10 w-full items-center gap-3 text-left focus-visible:outline-none" type="button" onClick={() => onChange({ known: !lift.known })}>
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${lift.known ? "border-transparent bg-forge-ember text-[#160a02]" : "border-white/25"}`}
        >
          {lift.known ? <Check className="h-4 w-4" /> : null}
        </span>
        <span className="flex-1 font-bold text-white">{lift.exerciseName}</span>
        {lift.known && preview ? (
          <span className="text-xs text-zinc-400">
            ≈ <span className="font-bold tabular-nums text-white">{formatNumber(preview)} {unit}</span> max
          </span>
        ) : null}
      </button>
      {lift.known ? (
        <div className="mt-3 grid grid-cols-3 gap-2 pl-9">
          <label className="block text-xs font-semibold text-zinc-400">
            Weight ({unit})
            <input className={`${smallInput} mt-1`} inputMode="decimal" placeholder="0" value={lift.weight} onChange={(event) => onChange({ weight: cleanDecimal(event.target.value) })} />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">
            Reps
            <input className={`${smallInput} mt-1`} inputMode="numeric" value={lift.reps} onChange={(event) => onChange({ reps: cleanInteger(event.target.value).slice(0, 2) })} />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">
            Effort (RPE)
            <input className={`${smallInput} mt-1`} inputMode="numeric" placeholder="opt." value={lift.rpe} onChange={(event) => onChange({ rpe: cleanInteger(event.target.value).slice(0, 2) })} />
          </label>
        </div>
      ) : null}
    </li>
  );
};

const AssessmentPage = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { user, refreshUser } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({
    trainingHistory: "new",
    weeklyFrequency: "1_to_2",
    gymConfidence: "somewhat_confident",
    goalPath: user?.goalPath || "Beginner Foundation",
    knowsLifts: "no",
    lifts: mainLifts.map((exerciseName) => ({ exerciseName, known: false, weight: "", reps: "1", rpe: "" })),
    limitations: ["None"],
    otherLimitation: "",
    preferredTrainingStyle: "Unsure"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const knownLifts = useMemo(
    () =>
      answers.knowsLifts === "yes"
        ? answers.lifts
            .filter((lift) => lift.known && Number(lift.weight) > 0 && Number(lift.reps) > 0)
            .map((lift) => ({ ...lift, estimatedOneRepMax: estimateOneRepMax(lift.weight, lift.reps) }))
        : [],
    [answers.lifts, answers.knowsLifts]
  );

  const set = (patch) => setAnswers((current) => ({ ...current, ...patch }));
  const setLift = (exerciseName, patch) =>
    setAnswers((current) => ({ ...current, lifts: current.lifts.map((lift) => (lift.exerciseName === exerciseName ? { ...lift, ...patch } : lift)) }));

  const toggleLimitation = (limitation) =>
    setAnswers((current) => {
      if (limitation === "None") return { ...current, limitations: ["None"] };
      const withoutNone = current.limitations.filter((item) => item !== "None");
      const limitations = withoutNone.includes(limitation) ? withoutNone.filter((item) => item !== limitation) : [...withoutNone, limitation];
      return { ...current, limitations: limitations.length ? limitations : ["None"] };
    });

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1);
    setError("");
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const handleSkip = async () => {
    setSaving(true);
    setError("");
    try {
      await assessmentService.skipAssessment();
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const data = await assessmentService.completeAssessment({
        answers: { ...answers, lifts: knownLifts.map(({ exerciseName, weight, reps, rpe }) => ({ exerciseName, weight, reps, rpe })) }
      });
      setResult(data);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const variants = {
    enter: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * -32 })
  };

  const steps = [
    <div className="space-y-5" key="welcome">
      <h2 className="font-display text-2xl text-white sm:text-3xl">A smarter starting point.</h2>
      <p className="max-w-2xl text-zinc-300">
        Six quick steps. ForgeLift uses your answers to estimate your level and suggest starting weights. Don't know your lifts yet? That's fine, it learns from
        your first workouts too.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [AssessmentIcon, "Training level", "Beginner, intermediate or advanced, worked out from your answers."],
          [BaselinesIcon, "Starting weights", "Optional lift numbers turn into suggested weights for related exercises."],
          [InfoIcon, "First recommendations", "Early guidance that fits your goal and background."]
        ].map(([Icon, title, text]) => (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4" key={title}>
            <Icon aria-hidden="true" className="h-6 w-6 text-orange-300" />
            <h3 className="mt-3 font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p>
          </div>
        ))}
      </div>
    </div>,
    <div className="space-y-7" key="background">
      <ChoiceGrid id="history" label="Have you trained in a gym before?" options={trainingHistoryOptions} value={answers.trainingHistory} onChange={(trainingHistory) => set({ trainingHistory })} />
      <ChoiceGrid id="frequency" label="How many days a week do you usually train?" options={weeklyOptions} value={answers.weeklyFrequency} onChange={(weeklyFrequency) => set({ weeklyFrequency })} />
      <ChoiceGrid id="confidence" label="How confident are you with gym exercises?" options={confidenceOptions} value={answers.gymConfidence} onChange={(gymConfidence) => set({ gymConfidence })} />
    </div>,
    <div className="space-y-4" key="goal">
      <ChoiceGrid
        id="goal"
        label="What's your main goal?"
        options={goalPaths.map((goal) => ({ value: goal.name, label: goal.name, description: goal.description }))}
        value={answers.goalPath}
        onChange={(goalPath) => set({ goalPath })}
      />
      <p className="text-sm text-zinc-500">Saving updates the goal on your profile too.</p>
    </div>,
    <div className="space-y-5" key="lifts">
      <Segmented
        label="Do you know any of your current lifts?"
        options={[
          { value: "yes", label: "Yes, some" },
          { value: "no", label: "Not yet" }
        ]}
        value={answers.knowsLifts}
        onChange={(knowsLifts) => set({ knowsLifts })}
      />
      {answers.knowsLifts === "yes" ? (
        <>
          <p className="text-sm text-zinc-400">Tick the ones you know and enter a recent set. A set of several reps works; ForgeLift estimates your 1-rep max from it.</p>
          <ul className="space-y-2">
            {answers.lifts.map((lift) => (
              <LiftRow key={lift.exerciseName} lift={lift} unit={unit} onChange={(patch) => setLift(lift.exerciseName, patch)} />
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300">
          No problem. ForgeLift starts conservatively and learns from the first workouts you log.
        </p>
      )}
    </div>,
    <div className="space-y-7" key="limits">
      <p className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-sm leading-6 text-amber-100">
        This only makes suggestions more careful around these areas. It isn't medical advice.
      </p>
      <ChipSelect label="Any areas to go easy on?" options={limitationOptions} values={answers.limitations} onToggle={toggleLimitation} />
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-zinc-200">Anything else? (optional)</span>
        <input
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
          placeholder="e.g. old ankle sprain"
          value={answers.otherLimitation}
          onChange={(event) => set({ otherLimitation: event.target.value })}
        />
      </label>
      <ChoiceGrid
        id="style"
        label="What kind of training do you enjoy most?"
        options={styleOptions.map((style) => ({ value: style, label: style }))}
        value={answers.preferredTrainingStyle}
        onChange={(preferredTrainingStyle) => set({ preferredTrainingStyle })}
      />
    </div>,
    <div className="space-y-5" key="review">
      {result ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-4 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.08] p-5"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <SuccessIcon aria-hidden="true" className="h-8 w-8 shrink-0 text-emerald-300" />
          <div>
            <p className="font-display text-2xl text-white">You're {result.levelResult?.calculatedLevel || "set up"}.</p>
            <p className="mt-1 text-sm text-emerald-100">
              {result.levelResult?.confidence ? `${result.levelResult.confidence} confidence. ` : ""}Your starting weights and recommendations are updated.
            </p>
          </div>
        </motion.div>
      ) : (
        <h2 className="font-display text-2xl text-white">Check and save</h2>
      )}
      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <dt className="text-sm text-zinc-400">Goal</dt>
          <dd className="mt-0.5 font-bold text-white">{answers.goalPath}</dd>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <dt className="text-sm text-zinc-400">Lifts entered</dt>
          <dd className="mt-0.5 font-bold text-white">{knownLifts.length || "None, ForgeLift will learn from your workouts"}</dd>
        </div>
      </dl>
      {knownLifts.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {knownLifts.map((lift) => (
            <li className="flex items-baseline justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm" key={lift.exerciseName}>
              <span className="font-semibold text-white">{lift.exerciseName}</span>
              <span className="text-zinc-400">
                ≈ <span className="font-bold tabular-nums text-white">{formatNumber(lift.estimatedOneRepMax)} {unit}</span> max
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm leading-6 text-zinc-400">Ranks still come mostly from workouts you actually log. These answers only shape where you start.</p>
      {result?.recommendations?.length ? (
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <h3 className="font-display flex items-center gap-2 text-lg text-white">
            <GoalIcon aria-hidden="true" className="h-5 w-5 text-orange-300" />
            Where to start
          </h3>
          <ol className="mt-3 space-y-2.5 text-sm leading-6 text-zinc-300">
            {result.recommendations.map((item, index) => (
              <li className="flex gap-3" key={item}>
                <span className="font-display mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-xs text-orange-300">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  ];

  const last = step === STEPS.length - 1;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div data-tour-id="assessment-overview">
          <PageHeader
            description="Tell ForgeLift about your training so it can estimate your level and personalise where you start."
            eyebrow="ForgeLift assessment"
            title="Find your starting point"
            tutorialPageKey="assessment"
          />
        </div>
        <Progress step={step} />

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <section className={`${card} overflow-clip p-5 sm:p-7`}>
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div animate="center" custom={direction} exit="exit" initial="enter" key={step} transition={{ duration: 0.3, ease: EASE }} variants={variants}>
              {steps[step]}
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="mt-5 flex items-center justify-between gap-2">
          {step > 0 && !result ? (
            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
              disabled={saving}
              type="button"
              onClick={() => goTo(step - 1)}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {!result ? (
              <button className="min-h-12 rounded-full px-4 text-sm font-semibold text-zinc-400 hover:text-white disabled:opacity-40" disabled={saving} type="button" onClick={handleSkip}>
                Skip for now
              </button>
            ) : null}
            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
              disabled={saving}
              type="button"
              onClick={() => (result ? navigate("/dashboard") : last ? handleSave() : goTo(step + 1))}
            >
              {result ? "Go to dashboard" : last ? (saving ? "Saving..." : "Save assessment") : "Next"}
              {!last && !result ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentPage;
