import { Search, X } from "lucide-react";

const SearchInput = ({ label, value, onChange, placeholder = "Search", className = "" }) => (
  <label className={`block ${className}`}>
    {label ? <span className="mb-2 block text-sm font-semibold text-zinc-200">{label}</span> : null}
    <span className="flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-4 pr-1.5 text-white transition-colors focus-within:border-forge-ember/60 focus-within:bg-white/[0.06]">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
      <input
        aria-label={label ? undefined : placeholder}
        className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-500 sm:text-sm"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={onChange}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          type="button"
          onClick={() => onChange({ target: { value: "" } })}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </span>
  </label>
);

export default SearchInput;
