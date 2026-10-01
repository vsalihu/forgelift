import { useState } from "react";
import Button from "../Button.jsx";
import FormInput from "../FormInput.jsx";
import CitySearch from "./CitySearch.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { WEIGHT_GOAL_OPTIONS } from "./boards.js";

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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ cityId: city?.cityId, birthYear: Number(birthYear), weightGoal, confirmAdult });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <CitySearch value={city} onChange={setCity} />
        <p className="mt-1.5 text-[11px] text-slate-500">
          City data ©{" "}
          <a className="underline hover:text-slate-300" href="https://www.geonames.org" rel="noreferrer" target="_blank">
            GeoNames
          </a>{" "}
          (CC BY 4.0)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          inputMode="numeric"
          label="Birth year"
          max={currentYear - 18}
          min={currentYear - 110}
          placeholder={String(currentYear - 25)}
          type="number"
          value={birthYear}
          onChange={(event) => setBirthYear(event.target.value)}
        />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Bodyweight goal</span>
          <select
            className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none transition focus:border-forge-ember focus:ring-2 focus:ring-forge-ember/20 sm:text-sm"
            value={weightGoal}
            onChange={(event) => setWeightGoal(event.target.value)}
          >
            {WEIGHT_GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="-mt-2 text-xs leading-5 text-slate-500">
        Your birth year puts you in an age division and isn't shown to anyone. Your bodyweight goal decides which weight board you appear on.
      </p>

      <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
        <input
          checked={confirmAdult}
          className="mt-1 h-4 w-4 shrink-0 accent-orange-500"
          type="checkbox"
          onChange={(event) => setConfirmAdult(event.target.checked)}
        />
        <span>
          I&apos;m 18 or older, and I understand other ForgeLift users will see my name, username, city, rank badge and leaderboard
          scores. My workouts and other stats stay private.
        </span>
      </label>

      {error ? <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <Button className="w-full sm:w-auto" disabled={!city || !birthYear || !confirmAdult} loading={submitting} type="submit">
        {submitLabel}
      </Button>
    </form>
  );
};

export default CompetitionForm;
