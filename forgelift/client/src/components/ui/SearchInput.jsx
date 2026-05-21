import { Search, X } from "lucide-react";

const SearchInput = ({ label, value, onChange, placeholder = "Search", className = "" }) => (
  <label className={`block ${className}`}>
    {label ? <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span> : null}
    <span className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 text-white transition focus-within:border-forge-ember focus-within:ring-2 focus-within:ring-forge-ember/20">
      <Search className="h-4 w-4 shrink-0 text-slate-500" />
      <input
        className="min-h-11 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500 sm:text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value ? (
        <button className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" type="button" onClick={() => onChange({ target: { value: "" } })}>
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </span>
  </label>
);

export default SearchInput;
