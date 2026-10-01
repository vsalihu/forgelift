import { useState } from "react";
import BottomSheet from "../ui/BottomSheet.jsx";

const METRICS = [
  { value: "volume", label: "Most volume", description: "Total kg lifted wins." },
  { value: "workout_count", label: "Most workouts", description: "Whoever trains more often wins." }
];
const DURATIONS = [3, 7, 14, 30];

const NewChallengeModal = ({ open, opponentName, submitting, onClose, onSubmit }) => {
  const [metric, setMetric] = useState("volume");
  const [durationDays, setDurationDays] = useState(7);

  return (
    <BottomSheet open={open} title={`Challenge ${opponentName || "a friend"}`} onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ metric, durationDays: Number(durationDays) });
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-200">What counts</legend>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {METRICS.map((option) => (
              <button
                aria-checked={metric === option.value}
                className={`rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  metric === option.value ? "border-forge-ember/70 bg-forge-ember/[0.12]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
                key={option.value}
                role="radio"
                type="button"
                onClick={() => setMetric(option.value)}
              >
                <span className="block font-bold text-white">{option.label}</span>
                <span className="mt-0.5 block text-sm text-zinc-400">{option.description}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-200">How long</legend>
          <div className="grid grid-cols-4 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
            {DURATIONS.map((days) => (
              <button
                aria-checked={durationDays === days}
                className={`min-h-10 rounded-full text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${durationDays === days ? "bg-forge-ember text-[#160a02]" : "text-zinc-300 hover:text-white"}`}
                key={days}
                role="radio"
                type="button"
                onClick={() => setDurationDays(days)}
              >
                {days} days
              </button>
            ))}
          </div>
        </fieldset>
        <button className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02] disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "Sending…" : "Send challenge"}
        </button>
      </form>
    </BottomSheet>
  );
};

export default NewChallengeModal;
