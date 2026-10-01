import { useState } from "react";
import CitySearch from "./CitySearch.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { WEIGHT_GOAL_OPTIONS } from "./boards.js";

const GOAL_LABELS = { none: "Off", lose: "Losing", gain: "Gaining" };

const CompetitionForm = ({ initial, submitLabel, submitting, error, onSubmit }) => {
  const { user } = useAuth();
  // First-time joiners start from the city and birth year they gave at sign-up.
  const home = user?.location?.cityId ? user.location : null;
  const [city, setCity] = useState(
    initial?.cityId
      ? { cityId: initial.cityId, name: initial.cityName, countryName: initial.countryName }
      : home
        ? { cityId: home.cityId, name: home.cityName, countryName: home.countryName }
        : null
  );
  const signupBirthYear = user?.dateOfBirth ? new Date(user.dateOfBirth).getUTCFullYear() : "";
  const [birthYear, setBirthYear] = useState(initial?.birthYear ? String(initial.birthYear) : String(signupBirthYear));
  const [weightGoal, setWeightGoal] = useState(initial?.weightGoal || "none");
  const [confirmAdult, setConfirmAdult] = useState(Boolean(initial?.enabled));
  const currentYear = new Date().getFullYear();
  const ready = city && birthYear && confirmAdult;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ cityId: city?.cityId, birthYear: Number(birthYear), weightGoal, confirmAdult });
      }}
    >
      <div>
        <CitySearch value={city} onChange={setCity} />
        <p className="mt-1.5 text-[0.7rem] text-zinc-600">
          City data ©{" "}
          <a className="underline hover:text-zinc-300" href="https://www.geonames.org" rel="noreferrer" target="_blank">
            GeoNames
          </a>{" "}
          (CC BY 4.0)
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-zinc-200">Birth year</span>
        <input
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60 sm:max-w-[12rem]"
          inputMode="numeric"
          max={currentYear - 18}
          min={currentYear - 110}
          placeholder={String(currentYear - 25)}
          type="number"
          value={birthYear}
          onChange={(event) => setBirthYear(event.target.value)}
        />
        <span className="mt-1.5 block text-xs text-zinc-500">Puts you in an age division. Never shown to anyone.</span>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-200">Bodyweight boards</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
          {WEIGHT_GOAL_OPTIONS.map((option) => (
            <button
              aria-checked={weightGoal === option.value}
              aria-label={option.label}
              className={`min-h-10 rounded-full px-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${weightGoal === option.value ? "bg-forge-ember text-[#160a02]" : "text-zinc-300 hover:text-white"}`}
              key={option.value}
              role="radio"
              type="button"
              onClick={() => setWeightGoal(option.value)}
            >
              {GOAL_LABELS[option.value] || option.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">Decides whether you appear on the weight loss or weight gain board.</p>
      </fieldset>

      <button
        aria-checked={confirmAdult}
        className="flex w-full items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        role="checkbox"
        type="button"
        onClick={() => setConfirmAdult((value) => !value)}
      >
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${confirmAdult ? "border-forge-ember bg-forge-ember text-[#160a02]" : "border-white/25"}`}>
          {confirmAdult ? (
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" />
            </svg>
          ) : null}
        </span>
        <span className="text-sm leading-6 text-zinc-300">
          I&apos;m 18 or older. Other lifters will see my name, username, city, rank and leaderboard scores. My workouts and other stats stay private.
        </span>
      </button>

      {error ? (
        <p className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 sm:w-auto"
        disabled={!ready || submitting}
        type="submit"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
      {!ready ? <p className="text-xs text-zinc-500">{!city ? "Pick your city" : !birthYear ? "Add your birth year" : "Tick the box above"} to continue.</p> : null}
    </form>
  );
};

export default CompetitionForm;
