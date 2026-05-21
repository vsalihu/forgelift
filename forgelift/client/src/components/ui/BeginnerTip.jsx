const variantStyles = {
  default: "border-forge-copper/25 bg-forge-copper/10 text-orange-100",
  blue: "border-sky-400/20 bg-sky-500/10 text-sky-100",
  green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  red: "border-red-400/20 bg-red-500/10 text-red-100"
};

const BeginnerTip = ({ title = "Beginner tip", children, variant = "default" }) => (
  <div className={`rounded-lg border p-4 text-sm leading-6 ${variantStyles[variant] || variantStyles.default}`}>
    <p className="font-bold text-white">{title}</p>
    <div className="mt-1 text-current/90">{children}</div>
  </div>
);

export default BeginnerTip;
