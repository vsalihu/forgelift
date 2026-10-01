// Pill tabs with an optional count badge (e.g. new requests).
const SocialTabs = ({ tabs, value, onChange, label = "Sections" }) => (
  <div aria-label={label} className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist">
    {tabs.map((tab) => {
      const selected = tab.value === value;
      return (
        <button
          aria-controls={`panel-${tab.value}`}
          aria-selected={selected}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
            selected ? "border-forge-ember/50 bg-forge-ember/15 text-white" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
          }`}
          id={`tab-${tab.value}`}
          key={tab.value}
          role="tab"
          type="button"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.badge ? <span className="rounded-full bg-forge-ember px-1.5 py-0.5 text-[0.7rem] font-black leading-none text-[#160a02]">{tab.badge}</span> : null}
        </button>
      );
    })}
  </div>
);

export default SocialTabs;
