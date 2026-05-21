const variantClasses = {
  card: "h-32 rounded-lg",
  list: "h-16 rounded-lg",
  dashboard: "h-28 rounded-lg",
  chart: "h-72 rounded-lg",
  form: "h-12 rounded-md"
};

const LoadingSkeleton = ({ rows = 3, variant = "list", className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_item, index) => (
      <div className={`${variantClasses[variant] || variantClasses.list} animate-pulse bg-white/10`} key={index} />
    ))}
  </div>
);

export default LoadingSkeleton;
