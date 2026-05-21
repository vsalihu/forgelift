const SegmentedControl = ({ options = [], value, onChange, className = "" }) => (
  <div className={`inline-flex rounded-lg border border-white/10 bg-black/25 p-1 ${className}`}>
    {options.map((option) => (
      <button
        className={`min-h-10 rounded-md px-3 text-sm font-bold transition ${
          value === option.value ? "bg-forge-ember text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
