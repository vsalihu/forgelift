const FilterChipGroup = ({ items = [], value, onChange, className = "" }) => (
  <div className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 ${className}`}>
    {items.map((item) => {
      const itemValue = typeof item === "string" ? item : item.value;
      const label = typeof item === "string" ? item : item.label;
      const count = typeof item === "string" ? null : item.count;
      const disabled = typeof item === "string" ? false : item.disabled;
      const active = value === itemValue;

      return (
        <button
          className={`min-h-10 shrink-0 rounded-full px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
            active ? "bg-forge-ember text-white" : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
          }`}
          disabled={disabled}
          key={itemValue || label}
          type="button"
          onClick={() => onChange(itemValue)}
        >
          {label}
          {count !== null && count !== undefined ? ` (${count})` : ""}
        </button>
      );
    })}
  </div>
);

export default FilterChipGroup;
