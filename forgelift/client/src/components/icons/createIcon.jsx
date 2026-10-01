// ForgeLift's icons are drawn on a 24×24 grid with currentColor, so they take the same
// props and colours as lucide-react icons and can be swapped in directly.
export const createIcon = (displayName, children) => {
  const Icon = ({ size = 24, strokeWidth = 2, className = "", ...props }) => (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
};

export const Dot = ({ cx, cy, r = 1.3 }) => <circle cx={cx} cy={cy} fill="currentColor" r={r} stroke="none" />;
