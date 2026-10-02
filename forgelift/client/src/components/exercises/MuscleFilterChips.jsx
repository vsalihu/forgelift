// Scrollable row of muscle filter chips with the muscle illustration and a count.
const MuscleFilterChips = ({ muscles, counts = {}, value, onChange, imageFor, label = "Filter by muscle", allValue = "All", tourId }) => (
  <div aria-label={label} className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" data-tour-id={tourId} role="group">
    {muscles.map((muscle) => {
      const active = value === muscle;
      const image = imageFor?.(muscle);
      return (
        <button
          aria-pressed={active}
          className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
            active ? "border-transparent bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
          } ${image ? "" : "pl-3.5"}`}
          key={muscle}
          type="button"
          onClick={() => onChange(muscle)}
        >
          {image ? <img alt="" className={`h-8 w-8 rounded-full object-contain ${active ? "bg-black/15" : "bg-black/30"}`} src={image} /> : null}
          {muscle}
          {muscle !== allValue && counts[muscle] !== undefined ? (
            <span className={`text-xs tabular-nums ${active ? "text-[#160a02]/70" : "text-zinc-500"}`}>{counts[muscle]}</span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default MuscleFilterChips;
