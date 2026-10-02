import { Check } from "lucide-react";
import { MUSCLE_GROUPS, PRESETS } from "../../../utils/muscleMap.js";

const sameSet = (a, b) => a.length === b.length && a.every((item) => b.includes(item));

// Choose what a workout should train: quick presets, or tap muscle groups.
const MusclePicker = ({ value, onChange }) => {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-zinc-200">Quick picks</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active = sameSet(value, preset.groups);
            return (
              <button
                aria-pressed={active}
                className={`min-h-11 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  active ? "border-transparent bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                }`}
                key={preset.id}
                type="button"
                onClick={() => onChange(active ? [] : preset.groups)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-zinc-200">Or choose muscle groups</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {MUSCLE_GROUPS.map((group) => {
            const active = value.includes(group.id);
            return (
              <button
                aria-pressed={active}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 pb-2.5 pt-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  active ? "border-forge-ember/60 bg-forge-ember/[0.1] text-white" : "border-white/[0.08] bg-white/[0.025] text-zinc-300 hover:border-white/20"
                }`}
                key={group.id}
                type="button"
                onClick={() => toggle(group.id)}
              >
                <img alt="" className={`h-12 w-12 object-contain transition-opacity ${active ? "" : "opacity-70"}`} src={`/muscles/${group.image}.png`} />
                {group.label}
                <span
                  aria-hidden="true"
                  className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-forge-ember text-[#160a02]" : "border border-white/15"}`}
                >
                  {active ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};

export default MusclePicker;
