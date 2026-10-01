// Selection controls for the setup flow, styled to match the auth fields.

const tile = (selected) =>
  `w-full rounded-2xl border px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    selected
      ? "border-forge-ember/70 bg-forge-ember/[0.12] shadow-[0_0_28px_-10px_rgba(249,115,22,0.8)]"
      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
  }`;

// Single choice. Options: { value, label, description? }.
export const ChoiceGrid = ({ id, label, options, value, onChange, error, columns = 2 }) => (
  <fieldset aria-describedby={error ? `${id}-error` : undefined}>
    {label ? <legend className="mb-3 text-sm font-semibold text-zinc-200">{label}</legend> : null}
    <div className={`grid gap-2.5 ${columns === 2 ? "sm:grid-cols-2" : ""}`} role="radiogroup">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button aria-checked={selected} className={tile(selected)} key={option.value} role="radio" type="button" onClick={() => onChange(option.value)}>
            <span className={`block text-base font-semibold ${selected ? "text-white" : "text-zinc-200"}`}>{option.label}</span>
            {option.description ? <span className="mt-1 block text-sm leading-6 text-zinc-400">{option.description}</span> : null}
          </button>
        );
      })}
    </div>
    {error ? (
      <p className="mt-2 text-sm text-red-300" id={`${id}-error`} role="alert">
        {error}
      </p>
    ) : null}
  </fieldset>
);

// Two or three short options side by side, e.g. units.
export const Segmented = ({ label, options, value, onChange }) => (
  <fieldset>
    <legend className="mb-2 text-sm font-semibold text-zinc-200">{label}</legend>
    <div className="grid grid-flow-col gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            aria-checked={selected}
            className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
              selected ? "bg-forge-ember text-[#160a02] shadow-[0_0_20px_-6px_rgba(249,115,22,0.9)]" : "text-zinc-300 hover:text-white"
            }`}
            key={option.value}
            role="radio"
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </fieldset>
);

// Multi-select chips.
export const ChipSelect = ({ label, options, values, onToggle }) => (
  <fieldset>
    {label ? <legend className="mb-3 text-sm font-semibold text-zinc-200">{label}</legend> : null}
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            aria-pressed={selected}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
              selected ? "border-forge-ember/70 bg-forge-ember/15 text-white" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25"
            }`}
            key={option}
            type="button"
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  </fieldset>
);
