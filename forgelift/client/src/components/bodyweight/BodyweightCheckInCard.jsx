import { useId, useState } from "react";
import { Scale } from "lucide-react";
import { cleanDecimal } from "../gym/gymUtils.js";

const RANGE = { kg: [30, 300], lb: [66, 660] };

const BodyweightCheckInCard = ({ currentBodyweight, due = true, unit = "kg", onSave }) => {
  const inputId = useId();
  const [weight, setWeight] = useState(currentBodyweight ? String(currentBodyweight) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [min, max] = RANGE[unit] || RANGE.kg;
  const value = Number(weight);
  const valid = weight !== "" && value >= min && value <= max;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!valid) {
      setError(`Enter a bodyweight between ${min} and ${max} ${unit}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ weight: value, unit });
    } catch (err) {
      setError(err.message || "Couldn't save your bodyweight.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`rounded-3xl border p-4 sm:p-5 ${
        due ? "border-forge-ember/30 bg-gradient-to-b from-forge-ember/[0.1] to-transparent" : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-forge-ember/15 text-orange-300">
          <Scale aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg text-white">{due ? "Weekly weigh-in" : "Log a weigh-in"}</h2>
          <p className="mt-0.5 text-sm leading-6 text-zinc-400">Keeps strength ratios and bodyweight exercises accurate. Decimals are fine.</p>
        </div>
      </div>
      <form className="flex items-end gap-2" noValidate onSubmit={handleSubmit}>
        <label className="min-w-0 flex-1" htmlFor={inputId}>
          <span className="mb-1.5 block text-sm font-semibold text-zinc-200">Bodyweight</span>
          <span className="relative block">
            <input
              aria-describedby={error ? `${inputId}-error` : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="off"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-4 pr-12 text-lg font-bold tabular-nums text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-forge-ember/60"
              id={inputId}
              inputMode="decimal"
              placeholder={unit === "lb" ? "176.5" : "80.4"}
              type="text"
              value={weight}
              onChange={(event) => {
                setWeight(cleanDecimal(event.target.value));
                setError("");
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-zinc-500">{unit}</span>
          </span>
        </label>
        <button
          className="min-h-12 shrink-0 rounded-2xl bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
          disabled={!weight || saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
      {error ? (
        <p className="mt-2 text-sm text-red-300" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
};

export default BodyweightCheckInCard;
