const FormInput = ({ label, error, className = "", ...props }) => {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-iron-ember focus:ring-2 focus:ring-iron-ember/20"
        {...props}
      />
      {error ? <span className="mt-2 block text-sm text-red-300">{error}</span> : null}
    </label>
  );
};

export default FormInput;
