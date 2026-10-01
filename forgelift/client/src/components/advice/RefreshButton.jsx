import { RefreshCw } from "lucide-react";

const RefreshButton = ({ busy, onClick, label = "Recalculate", busyLabel = "Recalculating…" }) => (
  <button
    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60"
    disabled={busy}
    type="button"
    onClick={onClick}
  >
    <RefreshCw aria-hidden="true" className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
    {busy ? busyLabel : label}
  </button>
);

export default RefreshButton;
