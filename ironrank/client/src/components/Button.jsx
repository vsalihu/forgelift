const variants = {
  primary: "bg-iron-ember text-white hover:bg-orange-600 focus:ring-orange-400",
  secondary: "bg-white/10 text-white hover:bg-white/15 focus:ring-white/30",
  ghost: "bg-transparent text-iron-steel hover:bg-white/10 focus:ring-white/20"
};

const Button = ({ children, className = "", variant = "primary", loading = false, ...props }) => {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;
