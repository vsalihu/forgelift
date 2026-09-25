import { useState } from "react";
import Button from "../Button.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";

const durationOptions = [
  { value: 3, label: "3 weeks" },
  { value: 4, label: "4 weeks (includes a deload week)" }
];

const GeneratePlanModal = ({ open, submitting, onClose, onSubmit }) => {
  const [durationWeeks, setDurationWeeks] = useState(3);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ durationWeeks });
  };

  return (
    <BottomSheet open={open} title="Generate your training plan" onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <p className="text-sm text-slate-400">
          ForgeLift will look at your recent training pattern and schedule the next few weeks — matching your usual
          training days, muscle-group rotation, and exercise count. You can edit any day afterward.
        </p>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">Plan length</span>
          <div className="grid gap-2">
            {durationOptions.map((option) => (
              <button
                className={`rounded-lg border p-3 text-left text-sm font-semibold transition ${
                  durationWeeks === option.value
                    ? "border-forge-ember bg-forge-ember/10 text-white"
                    : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/5"
                }`}
                key={option.value}
                type="button"
                onClick={() => setDurationWeeks(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" loading={submitting} type="submit">
          Generate Plan
        </Button>
      </form>
    </BottomSheet>
  );
};

export default GeneratePlanModal;
