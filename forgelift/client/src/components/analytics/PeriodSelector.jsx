const options = [
  { value: "month", label: "1M", title: "Last month" },
  { value: "90d", label: "3M", title: "Last 3 months" },
  { value: "180d", label: "6M", title: "Last 6 months" },
  { value: "365d", label: "1Y", title: "Last year" },
  { value: "all", label: "All", title: "All time" }
];

const PeriodSelector = ({ value, onChange }) => (
  <div aria-label="Date range" className="inline-flex rounded-md border border-white/10 bg-black/30 p-1" role="group">
    {options.map((option) => (
      <button
        className={`rounded px-3 py-2 text-sm font-semibold transition ${
          value === option.value ? "bg-forge-ember text-white" : "text-slate-300 hover:bg-white/10"
        }`}
        aria-pressed={value === option.value}
        key={option.value}
        title={option.title}
        type="button"
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default PeriodSelector;
