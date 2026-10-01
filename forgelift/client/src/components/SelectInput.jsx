const SelectInput = ({ label, options, error, className = "", ...props }) => {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-zinc-200">{label}</span>
      <select
        className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-base text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-500 hover:border-white/20 focus:border-forge-ember/70 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(249,115,22,0.14)] sm:text-sm bg-[#101217]"
        {...props}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-2 block text-sm text-red-300">{error}</span> : null}
    </label>
  );
};

export default SelectInput;
