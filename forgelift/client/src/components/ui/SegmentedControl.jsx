// Pill tab bar. Scrolls sideways instead of overflowing when the labels don't fit.
// `fill` stretches it to the full width on phones, with equal-width tabs.
const SegmentedControl = ({ options = [], value, onChange, className = "", fill = false }) => (
  <div className={`scrollbar-none max-w-full overflow-x-auto ${className}`}>
    <div className={`${fill ? "flex w-full sm:inline-flex sm:w-auto" : "inline-flex"} gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1`} role="tablist">
      {options.map((option) => (
        <button
          aria-selected={value === option.value}
          className={`min-h-10 shrink-0 whitespace-nowrap ${fill ? "flex-1 px-2 sm:flex-none sm:px-4" : "px-4"} rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
            value === option.value ? "bg-forge-ember text-[#160a02] shadow-[0_0_20px_-6px_rgba(249,115,22,0.9)]" : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
          }`}
          key={option.value}
          role="tab"
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export default SegmentedControl;
