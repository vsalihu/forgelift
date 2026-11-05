import { useEffect, useState } from "react";
import BottomSheet from "../ui/BottomSheet.jsx";

// Set an exact amount. step chips nudge it; "Set to target" fills it in.
const AmountSheet = ({ open, title, unit, value, target, steps = [], onSave, onClose }) => {
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (open) setDraft(String(Math.round(value || 0)));
  }, [open, value]);
  const nudge = (delta) => setDraft((current) => String(Math.max(0, Math.round((Number(current) || 0) + delta))));
  const save = () => {
    const number = Number(draft);
    if (!Number.isFinite(number) || number < 0) return;
    onSave(number);
  };
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="block">
          <span className="sr-only">
            {title} in {unit}
          </span>
          <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-forge-ember/60">
            <input
              autoFocus
              className="min-h-14 w-full bg-transparent font-display text-3xl tabular-nums text-white outline-none"
              inputMode="numeric"
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 5))}
            />
            <span className="text-lg font-semibold text-zinc-400">{unit}</span>
          </span>
        </label>
        <p className="text-sm text-zinc-400">
          Target today: <span className="font-semibold tabular-nums text-white">{target} {unit}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <button className="min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold tabular-nums text-zinc-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" key={step} type="button" onClick={() => nudge(step)}>
              {step > 0 ? `+${step}` : step}
            </button>
          ))}
          <button className="min-h-11 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 text-sm font-bold text-orange-100 hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => setDraft(String(target))}>
            Set to target
          </button>
        </div>
        <button className="min-h-12 w-full rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="submit">
          Save
        </button>
      </form>
    </BottomSheet>
  );
};

export default AmountSheet;
