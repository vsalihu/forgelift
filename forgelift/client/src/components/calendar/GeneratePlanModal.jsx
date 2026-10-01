import { useState } from "react";
import BottomSheet from "../ui/BottomSheet.jsx";

const OPTIONS = [
  { value: 3, label: "3 weeks", description: "A focused block on your current split." },
  { value: 4, label: "4 weeks", description: "Three building weeks, then a lighter deload week." }
];

const GeneratePlanModal = ({ open, submitting, onClose, onSubmit }) => {
  const [durationWeeks, setDurationWeeks] = useState(3);

  return (
    <BottomSheet open={open} title="Build your plan" onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ durationWeeks });
        }}
      >
        <p className="text-sm leading-6 text-zinc-400">
          ForgeLift schedules the coming weeks from your recent training: your usual days, how you rotate muscle groups, and how many exercises you do. You can change any day afterwards.
        </p>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-200">How long?</legend>
          <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup">
            {OPTIONS.map((option) => {
              const selected = durationWeeks === option.value;
              return (
                <button
                  aria-checked={selected}
                  className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    selected ? "border-forge-ember/70 bg-forge-ember/[0.12]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                  key={option.value}
                  role="radio"
                  type="button"
                  onClick={() => setDurationWeeks(option.value)}
                >
                  <span className="block text-base font-bold text-white">{option.label}</span>
                  <span className="mt-1 block text-sm text-zinc-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <button
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02] disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Building…" : "Build my plan"}
        </button>
      </form>
    </BottomSheet>
  );
};

export default GeneratePlanModal;
