const variants = {
  primary:
    "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(249,115,22,0.9)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_40px_-10px_rgba(249,115,22,1)]",
  secondary: "border border-white/12 bg-white/[0.05] text-white hover:border-white/25 hover:bg-white/[0.09]",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/[0.07] hover:text-white",
  danger: "border border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/20",
  success: "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
};

// Primary uses dark text on ember: white on this orange fails contrast.
const Button = ({ children, className = "", variant = "primary", loading = false, ...props }) => {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
};

export default Button;
