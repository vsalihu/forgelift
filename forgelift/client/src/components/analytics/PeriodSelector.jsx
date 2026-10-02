const options = [
  { value: "month", label: "1M", title: "Last month" },
  { value: "90d", label: "3M", title: "Last 3 months" },
  { value: "180d", label: "6M", title: "Last 6 months" },
  { value: "365d", label: "1Y", title: "Last year" },
  { value: "all", label: "All", title: "All time" }
];

const PeriodSelector = ({ value, onChange }) => (
  <div aria-label="Date range" className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="group">
    {options.map((option) => (
      <button
        aria-label={option.title}
        aria-pressed={value === option.value}
        className={`min-h-10 min-w-11 rounded-full px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
          value === option.value ? "bg-forge-ember text-[#160a02] shadow-[0_0_20px_-6px_rgba(249,115,22,0.9)]" : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
        }`}
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
