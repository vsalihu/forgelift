import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import { AuthBack, AuthField, AuthSubmit, FormAlert } from "../components/auth/AuthFields.jsx";
import { ChipSelect, ChoiceGrid, Segmented } from "../components/auth/Choices.jsx";
import { cleanDecimal } from "../components/gym/gymUtils.js";
import { SuccessIcon } from "../components/icons/featureIcons.jsx";
import { EASE } from "../components/landing/shared.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../services/api.js";
import { assessmentService } from "../services/assessmentService.js";
import { genderOptions, getDefaultStrengthStandard, getSuggestedMeasurements, goalPaths, strengthStandardOptions } from "../utils/onboarding.js";

// First-run setup: the old onboarding form and the assessment, merged so each question is asked once.

const STEPS = [
  {
    label: "Body",
    title: "Let's set your baseline.",
    subtitle: "A few basics so ranks and suggestions fit you.",
    rank: "Platinum",
    caption: { title: "Built around your body.", body: "Bodyweight and strength standard keep rank comparisons fair." }
  },
  {
    label: "Training",
    title: "How do you train now?",
    subtitle: "Be honest. This only sets your starting point.",
    rank: "Diamond",
    caption: { title: "Your starting level.", body: "How long and how often you train sets your first targets." }
  },
  {
    label: "Goal",
    title: "What are you training for?",
    subtitle: "You can change this any time from your profile.",
    rank: "Elite",
    caption: { title: "Pick a direction.", body: "Your goal shapes missions, suggestions and what ForgeLift highlights." }
  },
  {
    label: "Lifts",
    title: "Know any of your lifts?",
    subtitle: "Optional. Skip it if you're not sure.",
    rank: "Warrior",
    optional: true,
    caption: { title: "Starting weights, not guesses.", body: "Known lifts give better first suggestions. Ranks still come from logged workouts." }
  },
  {
    label: "Care",
    title: "Anything to be careful with?",
    subtitle: "Optional. Suggestions get more cautious for these areas.",
    rank: "Warrior",
    optional: true,
    caption: { title: "Train around it.", body: "This only makes suggestions more careful. It isn't medical advice." }
  },
  {
    label: "Measure",
    title: "Body measurements.",
    subtitle: "Optional and private. You can add them later.",
    rank: "Warrior",
    optional: true,
    caption: { title: "Track the change.", body: "Measurements show progress the scale can miss." }
  }
];

const HISTORY_OPTIONS = [
  { value: "new", label: "I'm new to the gym" },
  { value: "less_than_6_months", label: "Less than 6 months" },
  { value: "six_to_eighteen_months", label: "6 to 18 months" },
  { value: "eighteen_months_to_three_years", label: "18 months to 3 years" },
  { value: "three_plus_years", label: "3+ years" }
];
const FREQUENCY_OPTIONS = [
  { value: "0", label: "Not yet" },
  { value: "1_to_2", label: "1 to 2 days" },
  { value: "3_to_4", label: "3 to 4 days" },
  { value: "5_plus", label: "5+ days" }
];
const CONFIDENCE_OPTIONS = [
  { value: "not_confident", label: "Not confident" },
  { value: "somewhat_confident", label: "Somewhat" },
  { value: "confident", label: "Confident" },
  { value: "very_confident", label: "Very confident" }
];
const STYLE_OPTIONS = ["Heavy strength work", "Muscle-building volume", "General fitness", "Fat loss/conditioning"];
const MAIN_LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-up", "Hip Thrust", "Romanian Deadlift"];
const LIMITATIONS = ["Shoulders", "Lower back", "Knees", "Hips", "Wrists/elbows"];

// Used until the assessment works out the real level.
const experienceFromHistory = (history) =>
  ({ new: "Beginner", less_than_6_months: "Beginner", six_to_eighteen_months: "Intermediate", eighteen_months_to_three_years: "Intermediate" })[history] ||
  "Advanced";

const estimateOneRepMax = (weight, reps) => {
  const w = Number(weight);
  const r = Number(reps);
  if (!(w > 0) || !(r > 0)) return 0;
  return r === 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10;
};

const StepProgress = ({ step }) => (
  <div className="mb-8">
    <ol aria-label="Setup progress" className="grid grid-cols-6 gap-1.5">
      {STEPS.map((item, index) => (
        <li aria-current={index === step ? "step" : undefined} key={item.label}>
          <span className="block h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.span
              animate={{ scaleX: index <= step ? 1 : 0 }}
              className="block h-full origin-left rounded-full bg-gradient-to-r from-forge-copper to-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
              initial={false}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </span>
        </li>
      ))}
    </ol>
    <p className="mt-3 text-sm text-zinc-400">
      Step {step + 1} of {STEPS.length}: <span className="font-semibold text-zinc-200">{STEPS[step].label}</span>
      {STEPS[step].optional ? <span className="text-zinc-500"> (optional)</span> : null}
    </p>
  </div>
);

const OnboardingPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const askAge = !user?.dateOfBirth;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [onboardingSaved, setOnboardingSaved] = useState(false);
  const [result, setResult] = useState(null);
  const [goingIn, setGoingIn] = useState(false);
  const headingStep = useRef(0);

  const [body, setBody] = useState({
    gender: "",
    customGenderLabel: "",
    selectedStrengthStandard: "",
    preferredUnits: user?.preferredUnits || "metric",
    height: "",
    bodyweight: "",
    age: ""
  });
  const [training, setTraining] = useState({ trainingHistory: "", weeklyFrequency: "", gymConfidence: "" });
  const [goal, setGoal] = useState({ goalPath: user?.goalPath || "", preferredTrainingStyle: "" });
  const [lifts, setLifts] = useState({ knowsLifts: "", selected: [], values: {} });
  const [care, setCare] = useState({ limitations: [], otherLimitation: "" });
  const [measurements, setMeasurements] = useState({});

  const imperial = body.preferredUnits === "imperial";
  const weightUnit = imperial ? "lb" : "kg";
  const lengthUnit = imperial ? "in" : "cm";
  const measurementFields = useMemo(() => getSuggestedMeasurements(body.gender), [body.gender]);

  useEffect(() => {
    if (headingStep.current === step) return;
    headingStep.current = step;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  const clear = (field) => setErrors((current) => (current[field] ? { ...current, [field]: "" } : current));

  const validate = (index) => {
    const next = {};
    if (index === 0) {
      if (!body.gender) next.gender = "Choose an option.";
      if (body.gender === "custom" && !body.customGenderLabel.trim()) next.customGenderLabel = "Enter how you describe yourself.";
      if (body.gender === "custom" && !body.selectedStrengthStandard) next.selectedStrengthStandard = "Choose a strength standard.";
      const height = Number(body.height);
      const [minH, maxH] = imperial ? [40, 100] : [100, 250];
      if (!(height >= minH && height <= maxH)) next.height = `Enter your height in ${lengthUnit} (${minH}-${maxH}).`;
      const weight = Number(body.bodyweight);
      const [minW, maxW] = imperial ? [66, 660] : [30, 300];
      if (!(weight >= minW && weight <= maxW)) next.bodyweight = `Enter your bodyweight in ${weightUnit} (${minW}-${maxW}).`;
      if (askAge && !(Number(body.age) >= 13 && Number(body.age) <= 110)) next.age = "Enter your age (13 or over).";
    }
    if (index === 1) {
      if (!training.trainingHistory) next.trainingHistory = "Choose one.";
      if (!training.weeklyFrequency) next.weeklyFrequency = "Choose one.";
      if (!training.gymConfidence) next.gymConfidence = "Choose one.";
    }
    if (index === 2 && !goal.goalPath) next.goalPath = "Pick the goal that fits best.";
    if (index === 3 && lifts.knowsLifts === "yes") {
      if (!lifts.selected.length) next.lifts = "Pick at least one lift, or choose \"Not yet\".";
      lifts.selected.forEach((name) => {
        const value = { reps: "1", ...lifts.values[name] };
        if (!(Number(value.weight) > 0)) next[`lift-${name}-weight`] = "Enter a weight.";
        const reps = Number(value.reps);
        if (!(reps >= 1 && reps <= 30)) next[`lift-${name}-reps`] = "1 to 30 reps.";
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goTo = (index) => {
    setDirection(index > step ? 1 : -1);
    setFormError("");
    setStep(index);
  };

  const save = async () => {
    setSaving(true);
    setFormError("");
    const standard = body.gender === "custom" ? body.selectedStrengthStandard : getDefaultStrengthStandard(body.gender);
    try {
      if (!onboardingSaved) {
        try {
          await api.completeOnboarding({
            gender: body.gender,
            customGenderLabel: body.customGenderLabel,
            selectedStrengthStandard: standard,
            age: askAge ? body.age : undefined,
            height: body.height,
            bodyweight: body.bodyweight,
            preferredUnits: body.preferredUnits,
            trainingExperience: experienceFromHistory(training.trainingHistory),
            goalPath: goal.goalPath,
            bodyMeasurements: measurements
          });
          setOnboardingSaved(true);
        } catch (error) {
          setFormError(error.message);
          goTo(0);
          return;
        }
      }

      const knownLifts =
        lifts.knowsLifts === "yes"
          ? lifts.selected.map((exerciseName) => ({ exerciseName, weight: lifts.values[exerciseName]?.weight, reps: lifts.values[exerciseName]?.reps || "1", rpe: "" }))
          : [];
      const data = await assessmentService.completeAssessment({
        answers: {
          ...training,
          goalPath: goal.goalPath,
          knowsLifts: lifts.knowsLifts === "yes" ? "yes" : "no",
          lifts: knownLifts,
          limitations: care.limitations.length ? care.limitations : ["None"],
          otherLimitation: care.otherLimitation.trim(),
          preferredTrainingStyle: goal.preferredTrainingStyle || "Unsure"
        }
      });
      setResult(data);
    } catch (error) {
      setFormError(error.message);
      if (/weight|reps|RPE/i.test(error.message)) goTo(3);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(step)) return;
    if (step < STEPS.length - 1) goTo(step + 1);
    else save();
  };

  const finish = async () => {
    setGoingIn(true);
    await refreshUser().catch(() => {});
    navigate("/dashboard", { replace: true });
  };

  const setLiftValue = (name, field, value) => {
    setLifts((current) => ({ ...current, values: { ...current.values, [name]: { reps: "1", ...current.values[name], [field]: value } } }));
    clear(`lift-${name}-${field}`);
  };

  const logoutAction = (
    <button
      className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
      type="button"
      onClick={() => {
        logout();
        navigate("/", { replace: true });
      }}
    >
      Log out
    </button>
  );

  if (result) {
    const level = result.levelResult?.calculatedLevel || user?.trainingExperience || "Beginner";
    const confidence = result.levelResult?.confidence;
    return (
      <AuthShell
        caption={{ title: "Ready when you are.", body: "Log your first workout and ForgeLift starts learning how you really train." }}
        headerAction={logoutAction}
        rank="Ultimate"
        subtitle={`Nice work, ${user?.name?.split(" ")[0] || "lifter"}. Here's where you start.`}
        title="You're set."
        wide
      >
        <div className="rounded-3xl border border-forge-ember/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(249,115,22,0.18),transparent_60%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-sm text-zinc-400">Starting level</p>
          <p className="font-display mt-1 text-4xl text-white">{level}</p>
          {confidence ? <p className="mt-2 text-sm text-zinc-400">{confidence} confidence, based on your answers</p> : null}
        </div>
        {result.recommendations?.length ? (
          <ul className="mt-6 space-y-3">
            {result.recommendations.slice(0, 4).map((item) => (
              <li className="flex gap-3 text-base leading-7 text-zinc-300" key={item}>
                <SuccessIcon className="mt-1 h-5 w-5 shrink-0 text-orange-300" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-6 text-sm leading-6 text-zinc-500">Ranks come from the workouts you log. These are starting points, and they adjust as you train.</p>
        <AuthSubmit busy={goingIn} busyLabel="Opening your dashboard…" className="mt-8" type="button" onClick={finish}>
          Go to dashboard
        </AuthSubmit>
      </AuthShell>
    );
  }

  const info = STEPS[step];
  const variants = {
    enter: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * 40, filter: reduce ? "none" : "blur(6px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * -40, filter: reduce ? "none" : "blur(6px)" })
  };

  return (
    <AuthShell caption={info.caption} headerAction={logoutAction} rank={info.rank} subtitle={info.subtitle} title={info.title} wide>
      <StepProgress step={step} />
      <FormAlert>{formError}</FormAlert>

      <form noValidate onSubmit={handleSubmit}>
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            animate="center"
            className="space-y-7"
            custom={direction}
            exit="exit"
            initial="enter"
            key={step}
            transition={{ duration: 0.35, ease: EASE }}
            variants={variants}
          >
            {step === 0 ? (
              <>
                <ChoiceGrid
                  error={errors.gender}
                  id="setup-gender"
                  label="Gender"
                  options={genderOptions}
                  value={body.gender}
                  onChange={(gender) => {
                    setBody({ ...body, gender, selectedStrengthStandard: gender === "custom" ? body.selectedStrengthStandard : "" });
                    clear("gender");
                  }}
                />
                {body.gender === "custom" ? (
                  <div className="space-y-5">
                    <AuthField
                      error={errors.customGenderLabel}
                      id="setup-custom-gender"
                      label="How do you describe yourself?"
                      value={body.customGenderLabel}
                      onChange={(event) => {
                        setBody({ ...body, customGenderLabel: event.target.value });
                        clear("customGenderLabel");
                      }}
                    />
                    <ChoiceGrid
                      error={errors.selectedStrengthStandard}
                      id="setup-standard"
                      label="Which strength standard should ranks use?"
                      options={strengthStandardOptions}
                      value={body.selectedStrengthStandard}
                      onChange={(selectedStrengthStandard) => {
                        setBody({ ...body, selectedStrengthStandard });
                        clear("selectedStrengthStandard");
                      }}
                    />
                  </div>
                ) : null}
                <Segmented
                  label="Units"
                  options={[
                    { value: "metric", label: "kg and cm" },
                    { value: "imperial", label: "lb and in" }
                  ]}
                  value={body.preferredUnits}
                  onChange={(preferredUnits) => setBody({ ...body, preferredUnits })}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthField
                    error={errors.height}
                    id="setup-height"
                    inputMode="decimal"
                    label={`Height (${lengthUnit})`}
                    placeholder={imperial ? "70" : "178"}
                    value={body.height}
                    onChange={(event) => {
                      setBody({ ...body, height: cleanDecimal(event.target.value) });
                      clear("height");
                    }}
                  />
                  <AuthField
                    error={errors.bodyweight}
                    id="setup-bodyweight"
                    inputMode="decimal"
                    label={`Bodyweight (${weightUnit})`}
                    placeholder={imperial ? "180.5" : "80.4"}
                    value={body.bodyweight}
                    onChange={(event) => {
                      setBody({ ...body, bodyweight: cleanDecimal(event.target.value) });
                      clear("bodyweight");
                    }}
                  />
                  {askAge ? (
                    <AuthField
                      error={errors.age}
                      id="setup-age"
                      inputMode="numeric"
                      label="Age"
                      value={body.age}
                      onChange={(event) => {
                        setBody({ ...body, age: event.target.value });
                        clear("age");
                      }}
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <ChoiceGrid
                  error={errors.trainingHistory}
                  id="setup-history"
                  label="How long have you been training?"
                  options={HISTORY_OPTIONS}
                  value={training.trainingHistory}
                  onChange={(trainingHistory) => {
                    setTraining({ ...training, trainingHistory });
                    clear("trainingHistory");
                  }}
                />
                <ChoiceGrid
                  error={errors.weeklyFrequency}
                  id="setup-frequency"
                  label="Days a week you usually train"
                  options={FREQUENCY_OPTIONS}
                  value={training.weeklyFrequency}
                  onChange={(weeklyFrequency) => {
                    setTraining({ ...training, weeklyFrequency });
                    clear("weeklyFrequency");
                  }}
                />
                <ChoiceGrid
                  error={errors.gymConfidence}
                  id="setup-confidence"
                  label="How confident are you with gym exercises?"
                  options={CONFIDENCE_OPTIONS}
                  value={training.gymConfidence}
                  onChange={(gymConfidence) => {
                    setTraining({ ...training, gymConfidence });
                    clear("gymConfidence");
                  }}
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <ChoiceGrid
                  error={errors.goalPath}
                  id="setup-goal"
                  options={goalPaths.map((path) => ({ value: path.name, label: path.name, description: path.description }))}
                  value={goal.goalPath}
                  onChange={(goalPath) => {
                    setGoal({ ...goal, goalPath });
                    clear("goalPath");
                  }}
                />
                <ChipSelect
                  label="Preferred training style (optional)"
                  options={STYLE_OPTIONS}
                  values={goal.preferredTrainingStyle ? [goal.preferredTrainingStyle] : []}
                  onToggle={(style) => setGoal({ ...goal, preferredTrainingStyle: goal.preferredTrainingStyle === style ? "" : style })}
                />
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Segmented
                  label="Do you know your numbers for any main lifts?"
                  options={[
                    { value: "yes", label: "Yes, some" },
                    { value: "no", label: "Not yet" }
                  ]}
                  value={lifts.knowsLifts}
                  onChange={(knowsLifts) => {
                    setLifts({ ...lifts, knowsLifts });
                    clear("lifts");
                  }}
                />
                {lifts.knowsLifts === "yes" ? (
                  <>
                    <ChipSelect
                      label="Which ones?"
                      options={MAIN_LIFTS}
                      values={lifts.selected}
                      onToggle={(name) => {
                        setLifts((current) => ({
                          ...current,
                          selected: current.selected.includes(name) ? current.selected.filter((item) => item !== name) : [...current.selected, name]
                        }));
                        clear("lifts");
                      }}
                    />
                    {errors.lifts ? (
                      <p className="-mt-4 text-sm text-red-300" role="alert">
                        {errors.lifts}
                      </p>
                    ) : null}
                    {lifts.selected.length ? (
                      <div className="space-y-4">
                        <p className="text-sm leading-6 text-zinc-400">A recent set you did with good form: the weight and how many reps.</p>
                        {lifts.selected.map((name) => {
                          const value = lifts.values[name] || { reps: "1" };
                          const estimate = estimateOneRepMax(value.weight, value.reps);
                          return (
                            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4" key={name}>
                              <div className="flex items-baseline justify-between gap-3">
                                <p className="font-semibold text-white">{name}</p>
                                {estimate ? (
                                  <p className="text-sm tabular-nums text-orange-200">
                                    About {estimate} {weightUnit} max
                                  </p>
                                ) : null}
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <AuthField
                                  error={errors[`lift-${name}-weight`]}
                                  id={`lift-${name}-weight`}
                                  inputMode="decimal"
                                  label={`Weight (${weightUnit})`}
                                  value={value.weight || ""}
                                  onChange={(event) => setLiftValue(name, "weight", event.target.value)}
                                />
                                <AuthField
                                  error={errors[`lift-${name}-reps`]}
                                  id={`lift-${name}-reps`}
                                  inputMode="numeric"
                                  label="Reps"
                                  value={value.reps}
                                  onChange={(event) => setLiftValue(name, "reps", event.target.value)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : lifts.knowsLifts === "no" ? (
                  <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-base leading-7 text-zinc-400">
                    No problem. ForgeLift starts carefully and learns from your first few workouts.
                  </p>
                ) : null}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <ChipSelect
                  label="Areas to go easy on"
                  options={LIMITATIONS}
                  values={care.limitations}
                  onToggle={(area) =>
                    setCare((current) => ({
                      ...current,
                      limitations: current.limitations.includes(area) ? current.limitations.filter((item) => item !== area) : [...current.limitations, area]
                    }))
                  }
                />
                <AuthField
                  hint="Leave everything empty if nothing applies."
                  id="setup-other-limitation"
                  label="Anything else (optional)"
                  maxLength={120}
                  placeholder="e.g. recovering from a wrist sprain"
                  value={care.otherLimitation}
                  onChange={(event) => setCare({ ...care, otherLimitation: event.target.value })}
                />
              </>
            ) : null}

            {step === 5 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {measurementFields.map((field) => (
                  <AuthField
                    id={`measure-${field}`}
                    inputMode="decimal"
                    key={field}
                    label={`${field.charAt(0).toUpperCase()}${field.slice(1)} (${lengthUnit})`}
                    value={measurements[field] || ""}
                    onChange={(event) => setMeasurements({ ...measurements, [field]: event.target.value })}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex gap-3 pt-1">
              {step > 0 ? <AuthBack onClick={() => goTo(step - 1)}>Back</AuthBack> : null}
              <AuthSubmit busy={saving} busyLabel="Saving your setup…" type="submit">
                {step < STEPS.length - 1 ? "Continue" : "Finish setup"}
              </AuthSubmit>
            </div>
            {info.optional && step < STEPS.length - 1 ? (
              <button
                className="mx-auto block rounded-full px-4 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                type="button"
                onClick={() => {
                  setErrors({});
                  if (step === 3) setLifts({ knowsLifts: "no", selected: [], values: {} });
                  goTo(step + 1);
                }}
              >
                Skip this step
              </button>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </form>
    </AuthShell>
  );
};

export default OnboardingPage;
