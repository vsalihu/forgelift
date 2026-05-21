const options = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" }
];

const PeriodSelector = ({ value, onChange }) => (
  <div className="inline-flex rounded-md border border-white/10 bg-black/30 p-1">
    {options.map((option) => (
      <button
        className={`rounded px-3 py-2 text-sm font-semibold transition ${
          value === option.value ? "bg-forge-ember text-white" : "text-slate-300 hover:bg-white/10"
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

export default PeriodSelector;
