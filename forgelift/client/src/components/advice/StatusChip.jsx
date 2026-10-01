import { tone as getTone } from "./tones.js";

const StatusChip = ({ tone = "neutral", icon: Icon, children, className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getTone(tone).chip} ${className}`}>
    {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
    {children}
  </span>
);

export default StatusChip;
