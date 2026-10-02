import { ChevronDown } from "lucide-react";

// Compact pill-shaped select used for exercise filters. An empty value means "any".
const FilterSelect = ({ label, anyLabel, value, options, onChange }) => (
  <label className="relative flex min-w-[9.5rem] flex-1 sm:flex-none">
    <span className="sr-only">{label}</span>
    <select
      className={`min-h-11 w-full appearance-none rounded-full border bg-white/[0.04] py-2 pl-4 pr-9 text-sm font-bold outline-none [color-scheme:dark] hover:border-white/25 focus:border-forge-ember/60 ${
        value ? "border-forge-ember/40 text-orange-200" : "border-white/10 text-zinc-300"
      }`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{anyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
  </label>
);

export default FilterSelect;
