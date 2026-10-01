// Main muscle groups or every tracked muscle.
const ScopeToggle = ({ detailed, onChange }) => (
  <div aria-label="Muscles shown" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
    {[
      [false, "Main groups"],
      [true, "All muscles"]
    ].map(([value, label]) => (
      <button
        aria-checked={detailed === value}
        className={`min-h-9 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
          detailed === value ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
        }`}
        key={label}
        role="radio"
        type="button"
        onClick={() => onChange(value)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default ScopeToggle;
