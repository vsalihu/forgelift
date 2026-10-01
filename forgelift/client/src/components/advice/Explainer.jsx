import { ChevronDown } from "lucide-react";

// "How to read this": term definitions folded away until asked for.
const Explainer = ({ title = "How to read this", items = [], children, className = "" }) => (
  <details className={`group rounded-3xl border border-white/[0.06] bg-white/[0.02] ${className}`}>
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-zinc-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:px-5 [&::-webkit-details-marker]:hidden">
      {title}
      <ChevronDown aria-hidden="true" className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
      {children}
      {items.length ? (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {items.map(([term, definition]) => (
            <div key={term}>
              <dt className="text-sm font-bold text-orange-200">{term}</dt>
              <dd className="mt-0.5 text-sm leading-6 text-zinc-400">{definition}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  </details>
);

export default Explainer;
