import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import SelectInput from "../components/SelectInput.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { assessmentService } from "../services/assessmentService.js";
import { helpText } from "../utils/helpText.js";
import { goalPaths } from "../utils/onboarding.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const mainLifts = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-up",
  "Hip Thrust",
  "Romanian Deadlift"
];

const trainingHistoryOptions = [
  { value: "new", label: "No, I am new" },
  { value: "less_than_6_months", label: "Yes, less than 6 months" },
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
  const numericWeight = Number(weight) || 0;
  const numericReps = Number(reps) || 0;
  if (numericWeight <= 0 || numericReps <= 0) return 0;
  if (numericReps === 1) return numericWeight;
  return Math.round(numericWeight * (1 + numericReps / 30) * 10) / 10;
};

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const StepShell = ({ eyebrow, title, children }) => (
  <section className="metal-panel rounded-xl p-5 sm:p-6">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">{eyebrow}</p>
    <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
    <div className="mt-6 space-y-5">{children}</div>
  </section>
);

const OptionGrid = ({ options, value, onChange }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {options.map((option) => (
      <button
        className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
          value === option.value
            ? "border-forge-ember bg-forge-ember/15 text-white"
            : "border-white/10 bg-black/20 text-slate-300 hover:border-white/25"
        }`}
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
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

  const progress = Math.round(((step + 1) / 6) * 100);

  const setLift = (exerciseName, patch) => {
    setAnswers((current) => ({
      ...current,
      lifts: current.lifts.map((lift) => (lift.exerciseName === exerciseName ? { ...lift, ...patch } : lift))
    }));
  };

  const toggleLimitation = (limitation) => {
    setAnswers((current) => {
      if (limitation === "None") return { ...current, limitations: ["None"] };
      const withoutNone = current.limitations.filter((item) => item !== "None");
      const limitations = withoutNone.includes(limitation)
        ? withoutNone.filter((item) => item !== limitation)
        : [...withoutNone, limitation];
      return { ...current, limitations: limitations.length ? limitations : ["None"] };
    });
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
      const payload = {
        answers: {
          ...answers,
          lifts: knownLifts.map(({ exerciseName, weight, reps, rpe }) => ({ exerciseName, weight, reps, rpe }))
        }
      };
      const data = await assessmentService.completeAssessment(payload);
      setResult(data);
      await refreshUser();
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = step < 5;

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div data-tour-id="assessment-overview" className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">ForgeLift Assessment</p>
          <h1 className="mt-2 text-3xl font-black text-white">Personalise your starting point</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Complete your ForgeLift Assessment so we can estimate your current level and personalise your starting
            recommendations.
          </p>
          <div className="mt-4">
            <TutorialLauncher pageKey="assessment" steps={getTutorialSteps("assessment")} />
          </div>
        </div>

        <div data-tour-id="assessment-progress" className="mb-5 rounded-full bg-black/30 p-1">
          <div className="h-2 rounded-full bg-forge-ember transition-all" style={{ width: `${progress}%` }} />
        </div>

        {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

        {step === 0 ? (
          <StepShell eyebrow="Step 1 of 6" title="Welcome">
            {user?.beginnerTipsEnabled !== false ? (
              <BeginnerTip title="Do not worry if you do not know your lifts yet">
                ForgeLift can learn from your first few workouts. The assessment simply gives the app a smarter
                starting point for training level, baselines, and early recommendations.
              </BeginnerTip>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-black/20 p-4">
                <ClipboardCheck className="h-6 w-6 text-forge-ember" />
                <h3 className="mt-3 font-bold text-white">Training level</h3>
                <p className="mt-2 text-sm text-slate-400">Beginner, Intermediate, or Advanced.</p>
              </div>
              <div className="rounded-lg bg-black/20 p-4">
                <Dumbbell className="h-6 w-6 text-forge-ember" />
                <h3 className="mt-3 font-bold text-white">Strength baselines</h3>
                <p className="mt-2 text-sm text-slate-400">Optional lift numbers for smarter starting weights.</p>
              </div>
              <div className="rounded-lg bg-black/20 p-4">
                <Info className="h-6 w-6 text-forge-ember" />
                <h3 className="mt-3 font-bold text-white">Recommendations</h3>
                <p className="mt-2 text-sm text-slate-400">Early guidance based on your goal and background.</p>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell eyebrow="Step 2 of 6" title="Training background">
            <div>
              <h3 className="mb-3 font-bold text-white">Have you trained in a gym before?</h3>
              <OptionGrid
                options={trainingHistoryOptions}
                value={answers.trainingHistory}
                onChange={(value) => setAnswers({ ...answers, trainingHistory: value })}
              />
            </div>
            <div>
              <h3 className="mb-3 font-bold text-white">How many days per week do you usually train?</h3>
              <OptionGrid
                options={weeklyOptions}
                value={answers.weeklyFrequency}
                onChange={(value) => setAnswers({ ...answers, weeklyFrequency: value })}
              />
            </div>
            <div>
              <h3 className="mb-3 font-bold text-white">How confident are you with gym exercises?</h3>
              <OptionGrid
                options={confidenceOptions}
                value={answers.gymConfidence}
                onChange={(value) => setAnswers({ ...answers, gymConfidence: value })}
              />
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell eyebrow="Step 3 of 6" title="Main goal">
            <SelectInput
              label="What is your main goal?"
              options={goalPaths.map((goal) => ({ value: goal.name, label: goal.name }))}
              value={answers.goalPath}
              onChange={(event) => setAnswers({ ...answers, goalPath: event.target.value })}
            />
            <p className="text-sm text-slate-400">This can update your profile goal path when you save.</p>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell eyebrow="Step 4 of 6" title="Current lifts">
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                Do you know any of your current lifts? <HelpTooltip {...helpText.estimated1RM} />
              </h3>
              <OptionGrid
                options={[
                  { value: "yes", label: "Yes, I know some" },
                  { value: "no", label: "No, I do not know yet" }
                ]}
                value={answers.knowsLifts}
                onChange={(value) => setAnswers({ ...answers, knowsLifts: value })}
              />
            </div>
            {answers.knowsLifts === "yes" ? (
              <div className="space-y-4">
                {answers.lifts.map((lift) => {
                  const preview = estimateOneRepMax(lift.weight, lift.reps);
                  return (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4" key={lift.exerciseName}>
                      <label className="flex items-center gap-3 font-bold text-white">
                        <input
                          checked={lift.known}
                          className="h-4 w-4 accent-forge-ember"
                          type="checkbox"
                          onChange={(event) => setLift(lift.exerciseName, { known: event.target.checked })}
                        />
                        {lift.exerciseName}
                      </label>
                      {lift.known ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <FormInput
                            label={`Weight (${user?.preferredUnits === "imperial" ? "lb" : "kg"})`}
                            min="0"
                            type="number"
                            value={lift.weight}
                            onChange={(event) => setLift(lift.exerciseName, { weight: event.target.value })}
                          />
                          <FormInput
                            label="Reps"
                            max="30"
                            min="1"
                            type="number"
                            value={lift.reps}
                            onChange={(event) => setLift(lift.exerciseName, { reps: event.target.value })}
                          />
                          <FormInput
                            label={<span>RPE <HelpTooltip {...helpText.rpe} size="xs" /></span>}
                            max="10"
                            min="1"
                            type="number"
                            value={lift.rpe}
                            onChange={(event) => setLift(lift.exerciseName, { rpe: event.target.value })}
                          />
                          <p className="text-sm text-slate-400 sm:col-span-3">
                            Estimated 1RM preview: <span className="font-bold text-white">{formatNumber(preview)}</span>
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                No problem. ForgeLift will classify conservatively and learn from your first logged workouts.
              </div>
            )}
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell eyebrow="Step 5 of 6" title="Limitations and preferences">
            <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              This is only used to make training suggestions more cautious. It is not medical advice.
            </div>
            <div>
              <h3 className="mb-3 font-bold text-white">Any areas you want to avoid or be careful with?</h3>
              <div className="flex flex-wrap gap-2">
                {limitationOptions.map((limitation) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      answers.limitations.includes(limitation)
                        ? "bg-forge-ember text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
                    }`}
                    key={limitation}
                    type="button"
                    onClick={() => toggleLimitation(limitation)}
                  >
                    {limitation}
                  </button>
                ))}
              </div>
              <FormInput
                className="mt-4"
                label="Other limitation (optional)"
                value={answers.otherLimitation}
                onChange={(event) => setAnswers({ ...answers, otherLimitation: event.target.value })}
              />
            </div>
            <SelectInput
              label="Preferred training style"
              options={styleOptions.map((style) => ({ value: style, label: style }))}
              value={answers.preferredTrainingStyle}
              onChange={(event) => setAnswers({ ...answers, preferredTrainingStyle: event.target.value })}
            />
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell eyebrow="Step 6 of 6" title={result ? "Assessment saved" : "Review and save"}>
            {result ? (
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-200" />
                  <div>
                    <p className="font-bold text-white">
                      Assessment Level: {result.levelResult?.calculatedLevel} ({result.levelResult?.confidence} confidence)
                    </p>
                    <p className="mt-1 text-sm text-emerald-100">
                      Strength baselines and recommendations were updated.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-black/20 p-4">
                <p className="text-sm text-slate-400">Goal path</p>
                <p className="mt-1 font-bold text-white">{answers.goalPath}</p>
              </div>
              <div className="rounded-lg bg-black/20 p-4">
                <p className="text-sm text-slate-400">Known lifts entered</p>
                <p className="mt-1 font-bold text-white">{knownLifts.length}</p>
              </div>
            </div>
            {knownLifts.length ? (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <h3 className="font-bold text-white">Entered lift estimates</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {knownLifts.map((lift) => (
                    <p className="rounded-md bg-white/5 p-3 text-sm text-slate-300" key={lift.exerciseName}>
                      <span className="font-bold text-white">{lift.exerciseName}</span>: {formatNumber(lift.estimatedOneRepMax)} estimated 1RM
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                No strength baselines will be created yet. ForgeLift will learn from real workout logs.
              </div>
            )}
            <div className="rounded-lg border border-forge-copper/30 bg-forge-copper/10 p-4 text-sm leading-6 text-orange-100">
              Actual ranks remain based mostly on real logged workouts. Assessment baselines are used for starting
              recommendations, not guaranteed performance.
            </div>
            {result?.recommendations?.length ? (
              <div className="rounded-lg bg-black/20 p-4">
                <h3 className="font-bold text-white">Starting recommendations</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {result.recommendations.map((recommendation) => (
                    <li key={recommendation}>- {recommendation}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </StepShell>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={step === 0 || saving} type="button" variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {!result ? (
              <Button loading={saving} type="button" variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            ) : null}
            {canGoNext ? (
              <Button type="button" onClick={() => setStep((value) => value + 1)}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : result ? (
              <Button type="button" onClick={() => navigate("/dashboard")}>
                Go to dashboard
              </Button>
            ) : (
              <Button loading={saving} type="button" onClick={handleSave}>
                Save Assessment
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentPage;
