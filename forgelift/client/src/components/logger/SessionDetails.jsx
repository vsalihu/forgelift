import { X } from "lucide-react";
import { useState } from "react";
import RpeGuide from "../ui/RpeGuide.jsx";

// Dates are kept as local YYYY-MM-DD strings while editing.
export const toLocalDay = (date = new Date()) => {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
};

const shiftDay = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return toLocalDay(value);
};

const formatDay = (day) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const pill = (selected) =>
  `min-h-10 min-w-0 flex-1 rounded-full px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    selected ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
  }`;

export const WhenPicker = ({ value, onChange }) => {
  const today = shiftDay(0);
  const yesterday = shiftDay(-1);
  const preset = value === today ? "today" : value === yesterday ? "yesterday" : "other";
  const [showPicker, setShowPicker] = useState(preset === "other");

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-zinc-200">When did you train?</legend>
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
        <button aria-checked={preset === "today" && !showPicker} className={pill(preset === "today" && !showPicker)} role="radio" type="button" onClick={() => { setShowPicker(false); onChange(today); }}>
          Today
        </button>
        <button aria-checked={preset === "yesterday" && !showPicker} className={pill(preset === "yesterday" && !showPicker)} role="radio" type="button" onClick={() => { setShowPicker(false); onChange(yesterday); }}>
          Yesterday
        </button>
        <button aria-checked={showPicker || preset === "other"} className={pill(showPicker || preset === "other")} role="radio" type="button" onClick={() => setShowPicker(true)}>
          {preset === "other" ? formatDay(value) : "Earlier"}
        </button>
      </div>
      {showPicker || preset === "other" ? (
        <label className="mt-3 block">
          <span className="sr-only">Workout date</span>
          <input
            className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none [color-scheme:dark] focus:border-forge-ember/60"
            max={today}
            min="2000-01-01"
            type="date"
            value={value}
            onChange={(event) => event.target.value && onChange(event.target.value)}
          />
        </label>
      ) : null}
    </fieldset>
  );
};

// Optional 1 to 10 rating. Stays "Not set" until the slider is moved.
export const RatingScale = ({ id, label, low, high, value, onChange }) => {
  const set = value !== "" && value !== null && value !== undefined;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 pb-3 pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-zinc-200" htmlFor={id}>
          {label}
        </label>
        {set ? (
          <span className="flex items-center gap-1">
            <span className="font-display text-lg tabular-nums text-white">{value}</span>
            <span className="text-xs text-zinc-500">/10</span>
            <button
              aria-label={`Clear ${label}`}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={() => onChange("")}
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <span className="py-1.5 text-xs font-semibold text-zinc-500">Not set</span>
        )}
      </div>
      <input
        aria-valuetext={set ? `${value} out of 10` : "Not set"}
        className={`mt-2 h-2 w-full cursor-pointer accent-[#f97316] transition-opacity ${set ? "" : "opacity-40"}`}
        id={id}
        max="10"
        min="1"
        step="1"
        type="range"
        value={set ? value : 5}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => !set && onChange(event.currentTarget.value)}
      />
      <div aria-hidden="true" className="mt-1 flex justify-between text-[0.7rem] text-zinc-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
};

const SessionDetails = ({ form, onChange, showRpeGuide }) => {
  const [guideOpen, setGuideOpen] = useState(false);
  const update = (key) => (value) => onChange({ ...form, [key]: value });

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6" data-tour-id="logger-workout-details">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300/90">Workout name</span>
        <input
          className="font-display mt-2 block w-full rounded-lg bg-transparent text-[1.75rem] leading-tight text-white outline-none placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-amber-200 sm:text-3xl"
          maxLength={80}
          placeholder="Push day"
          value={form.title}
          onChange={(event) => update("title")(event.target.value)}
        />
      </label>

      <div className="mt-5">
        <WhenPicker value={form.date} onChange={update("date")} />
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-200">How did it feel? <span className="font-normal text-zinc-500">Optional</span></h2>
        {showRpeGuide ? (
          <button aria-expanded={guideOpen} className="shrink-0 text-sm font-semibold text-orange-300 hover:text-orange-200" type="button" onClick={() => setGuideOpen((open) => !open)}>
            {guideOpen ? "Hide RPE guide" : "What's RPE?"}
          </button>
        ) : null}
      </div>
      {guideOpen ? (
        <div className="mt-3">
          <RpeGuide />
        </div>
      ) : null}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <RatingScale high="All out" id="session-rpe" label="Session effort (RPE)" low="Easy" value={form.sessionRPE} onChange={update("sessionRPE")} />
        <RatingScale high="Very sore" id="soreness" label="Soreness" low="Fresh" value={form.soreness} onChange={update("soreness")} />
        <RatingScale high="Great" id="sleep" label="Sleep last night" low="Poor" value={form.sleepQuality} onChange={update("sleepQuality")} />
        <RatingScale high="Charged" id="energy" label="Energy" low="Drained" value={form.energyLevel} onChange={update("energyLevel")} />
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-zinc-200">Notes</span>
        <textarea
          className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-base leading-7 text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
          placeholder="Anything worth remembering next time?"
          value={form.notes}
          onChange={(event) => update("notes")(event.target.value)}
        />
      </label>
    </section>
  );
};

export default SessionDetails;
