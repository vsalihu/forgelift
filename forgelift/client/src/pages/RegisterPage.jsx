import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import { AuthBack, AuthField, AuthSubmit, FieldMessage, FormAlert, PasswordField } from "../components/auth/AuthFields.jsx";
import CitySearch from "../components/compete/CitySearch.jsx";
import { ErrorIcon, SuccessIcon } from "../components/icons/featureIcons.jsx";
import { EASE } from "../components/landing/shared.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../services/api.js";

const MIN_AGE = 13;
const STEPS = [
  {
    label: "Account",
    title: "Create your account.",
    subtitle: "Takes about a minute. Free to start.",
    rank: "Copper",
    caption: { title: "Every lifter starts at Copper.", body: "Log a few workouts and ForgeLift starts learning how you train." }
  },
  {
    label: "About you",
    title: "About you.",
    subtitle: "This is how friends and rivals will find you.",
    rank: "Silver",
    caption: { title: "Your name on the board.", body: "Your username shows on leaderboards, challenges and your public profile." }
  },
  {
    label: "Location",
    title: "Where do you train?",
    subtitle: "Pick the city you live in.",
    rank: "Gold",
    caption: { title: "Your city has a leaderboard.", body: "If you choose to compete, you'll be ranked against lifters near you." }
  }
];

const FIELD_STEP = { email: 0, password: 0, name: 1, username: 1, dateOfBirth: 1, cityId: 2 };

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const passwordProblem = (value) => {
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return "Use at least one letter and one number.";
  return "";
};
const passwordScore = (value) =>
  [value.length >= 8, /[a-zA-Z]/.test(value) && /[0-9]/.test(value), /[a-z]/.test(value) && /[A-Z]/.test(value), value.length >= 12 || /[^a-zA-Z0-9]/.test(value)].filter(Boolean)
    .length;
const STRENGTH = ["Too short", "Weak", "Okay", "Good", "Strong"];

const isoDate = (date) => date.toISOString().slice(0, 10);
const ageOn = (value, now = new Date()) => {
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
};
const dobProblem = (value) => {
  if (!value) return "Enter your date of birth.";
  const age = ageOn(value);
  if (age === null) return "That date doesn't exist.";
  if (age < 0) return "Your date of birth can't be in the future.";
  if (age > 110) return "Please check the year you were born.";
  if (age < MIN_AGE) return `You need to be at least ${MIN_AGE} to use ForgeLift.`;
  return "";
};

const usernameSuggestions = (name, taken) => {
  const parts = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean);
  const first = parts[0] || "lifter";
  const last = parts[parts.length - 1] || "";
  const ideas = [`${first}${last}`, `${first}_${last.slice(0, 1)}`, `${first}_lifts`, `${first}${new Date().getFullYear() % 100}`];
  return [...new Set(ideas)].filter((idea) => /^[a-z0-9_]{3,20}$/.test(idea) && idea !== taken).slice(0, 3);
};

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (_error) {
    return "";
  }
};

const cityClasses = {
  label: "mb-2 block text-sm font-semibold text-zinc-200",
  input:
    "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-base text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-500 hover:border-white/20 focus:border-forge-ember/70 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(249,115,22,0.14),0_0_32px_-8px_rgba(249,115,22,0.55)] aria-[invalid=true]:border-red-400/60",
  list: "absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1014] p-1 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
};

const StepProgress = ({ step }) => (
  <ol aria-label="Sign-up progress" className="mb-8 grid grid-cols-3 gap-2">
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
        <span className={`mt-2 block text-xs font-semibold ${index === step ? "text-white" : "text-zinc-500"}`}>{item.label}</span>
      </li>
    ))}
  </ol>
);

const RegisterPage = () => {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", name: "", username: "", dateOfBirth: "" });
  const [city, setCity] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ state: "idle" });
  const firstFieldRef = useRef(null);
  const stepMounted = useRef(false);
  const timezone = useMemo(detectTimezone, []);

  const today = new Date();
  const maxDob = isoDate(new Date(Date.UTC(today.getUTCFullYear() - MIN_AGE, today.getUTCMonth(), today.getUTCDate())));
  const minDob = isoDate(new Date(Date.UTC(today.getUTCFullYear() - 110, 0, 1)));

  // Move focus to the first field of each new step (not on first load).
  useEffect(() => {
    if (!stepMounted.current) {
      stepMounted.current = true;
      return;
    }
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), reduce ? 0 : 380);
    return () => window.clearTimeout(timer);
  }, [step, reduce]);

  // Live username check, debounced.
  useEffect(() => {
    const username = form.username.trim();
    if (!username) {
      setUsernameStatus({ state: "idle" });
      return undefined;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameStatus({ state: "invalid" });
      return undefined;
    }
    setUsernameStatus({ state: "checking" });
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.checkUsername(username);
        if (!cancelled) setUsernameStatus({ state: result.available ? "available" : "taken" });
      } catch (_error) {
        if (!cancelled) setUsernameStatus({ state: "unknown" });
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.username]);

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  const update = (field) => (event) => {
    const value = field === "username" ? event.target.value.toLowerCase().replace(/\s/g, "") : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = (index) => {
    const next = {};
    if (index === 0) {
      if (!isEmail(form.email)) next.email = "Please enter a valid email address.";
      const problem = passwordProblem(form.password);
      if (problem) next.password = problem;
    }
    if (index === 1) {
      if (!form.name.trim()) next.name = "Enter your name.";
      if (!/^[a-z0-9_]{3,20}$/.test(form.username)) next.username = "3-20 characters: letters, numbers and underscores.";
      else if (usernameStatus.state === "taken") next.username = "That username is already taken.";
      const problem = dobProblem(form.dateOfBirth);
      if (problem) next.dateOfBirth = problem;
    }
    if (index === 2 && !city) next.cityId = "Choose your city from the list.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goTo = (index) => {
    setDirection(index > step ? 1 : -1);
    setFormError("");
    setStep(index);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), cityId: city.cityId, timezone });
      navigate("/onboarding", { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error.field && FIELD_STEP[error.field] !== undefined) {
        setErrors({ [error.field]: error.message });
        if (error.field === "username") setUsernameStatus({ state: "taken" });
        if (FIELD_STEP[error.field] !== step) goTo(FIELD_STEP[error.field]);
      } else {
        setFormError(error.message);
      }
    }
  };

  const score = passwordScore(form.password);
  const usernameHint = {
    idle: "Letters, numbers and underscores.",
    invalid: "3-20 characters: letters, numbers and underscores.",
    checking: "Checking…",
    available: "Nice, that one's yours.",
    taken: "Taken. Try one of these:",
    unknown: "Couldn't check right now. We'll confirm when you finish."
  }[usernameStatus.state];

  const stepInfo = STEPS[step];
  const variants = {
    enter: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * 40, filter: reduce ? "none" : "blur(6px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (dir) => ({ opacity: 0, x: reduce ? 0 : dir * -40, filter: reduce ? "none" : "blur(6px)" })
  };

  return (
    <AuthShell
      caption={stepInfo.caption}
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-bold text-orange-300 underline-offset-4 hover:text-orange-200 hover:underline" to="/login">
            Log in
          </Link>
        </>
      }
      rank={stepInfo.rank}
      subtitle={stepInfo.subtitle}
      title={stepInfo.title}
    >
      <StepProgress step={step} />
      <FormAlert>{formError}</FormAlert>

      <form noValidate onSubmit={handleSubmit}>
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            animate="center"
            className="space-y-5"
            custom={direction}
            exit="exit"
            initial="enter"
            key={step}
            transition={{ duration: 0.35, ease: EASE }}
            variants={variants}
          >
            {step === 0 ? (
              <>
                <AuthField
                  autoComplete="email"
                  error={errors.email}
                  id="register-email"
                  inputMode="email"
                  label="Email"
                  name="email"
                  placeholder="you@example.com"
                  ref={firstFieldRef}
                  spellCheck={false}
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
                <PasswordField
                  autoComplete="new-password"
                  error={errors.password}
                  id="register-password"
                  name="password"
                  value={form.password}
                  onChange={update("password")}
                >
                  {form.password && !errors.password ? (
                    <div aria-live="polite" className="mt-3">
                      <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <span
                            className={`h-1 rounded-full transition-colors duration-300 ${
                              score >= level ? (score >= 3 ? "bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.7)]" : "bg-forge-copper") : "bg-white/[0.08]"
                            }`}
                            key={level}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        Strength: <span className="font-semibold text-zinc-200">{STRENGTH[score]}</span>
                        {passwordProblem(form.password) ? <span className="text-zinc-500">. {passwordProblem(form.password)}</span> : null}
                      </p>
                    </div>
                  ) : !errors.password ? (
                    <p className="mt-2 text-sm text-zinc-500">At least 8 characters, with a letter and a number.</p>
                  ) : null}
                </PasswordField>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <AuthField
                  autoComplete="name"
                  error={errors.name}
                  id="register-name"
                  label="Full name"
                  maxLength={60}
                  name="name"
                  placeholder="Your name"
                  ref={firstFieldRef}
                  value={form.name}
                  onChange={update("name")}
                />
                <div>
                  <AuthField
                    autoCapitalize="none"
                    autoComplete="username"
                    error={errors.username}
                    hint={usernameHint}
                    id="register-username"
                    label="Username"
                    leading={<span className="text-base font-semibold">@</span>}
                    maxLength={20}
                    name="username"
                    placeholder="your_name"
                    spellCheck={false}
                    trailing={
                      usernameStatus.state === "available" ? (
                        <SuccessIcon className="mr-2 h-5 w-5 text-orange-300" />
                      ) : usernameStatus.state === "taken" ? (
                        <ErrorIcon className="mr-2 h-5 w-5 text-red-300" />
                      ) : null
                    }
                    value={form.username}
                    onChange={update("username")}
                  />
                  {usernameStatus.state === "taken" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {usernameSuggestions(form.name, form.username).map((idea) => (
                        <button
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-forge-ember/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                          key={idea}
                          type="button"
                          onClick={() => {
                            setForm((current) => ({ ...current, username: idea }));
                            setErrors((current) => ({ ...current, username: "" }));
                          }}
                        >
                          @{idea}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <AuthField
                  autoComplete="bday"
                  error={errors.dateOfBirth}
                  hint="Private. Sets your age group and never shows on your profile."
                  id="register-dob"
                  label="Date of birth"
                  max={maxDob}
                  min={minDob}
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={update("dateOfBirth")}
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div>
                  <CitySearch
                    classes={cityClasses}
                    describedBy={errors.cityId ? "register-city-error" : "register-city-hint"}
                    inputId="register-city"
                    invalid={Boolean(errors.cityId)}
                    label="City"
                    search={api.searchPublicCities}
                    value={city}
                    onChange={(next) => {
                      setCity(next);
                      if (next) setErrors((current) => ({ ...current, cityId: "" }));
                    }}
                  />
                  <FieldMessage
                    error={errors.cityId}
                    hint="Private. Used for local leaderboards and sensible defaults like kg or lb."
                    id="register-city"
                  />
                </div>
                {timezone ? (
                  <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
                    Time zone <span className="font-semibold text-zinc-200">{timezone.replace(/_/g, " ")}</span>, picked up from this device.
                  </p>
                ) : null}
                <p className="text-xs leading-5 text-zinc-500">
                  City data ©{" "}
                  <a className="underline hover:text-zinc-300" href="https://www.geonames.org" rel="noreferrer" target="_blank">
                    GeoNames
                  </a>{" "}
                  (CC BY 4.0)
                </p>
              </>
            ) : null}

            <div className="flex gap-3 pt-2">
              {step > 0 ? <AuthBack onClick={() => goTo(step - 1)}>Back</AuthBack> : null}
              <AuthSubmit busy={submitting} busyLabel="Creating your account…" type="submit">
                {step < STEPS.length - 1 ? "Continue" : "Create account"}
              </AuthSubmit>
            </div>
          </motion.div>
        </AnimatePresence>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
