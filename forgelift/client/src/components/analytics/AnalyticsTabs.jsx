import { NavLink } from "react-router-dom";
import { MedalIcon } from "../icons/featureIcons.jsx";
import { AnalyticsIcon, ProgressIcon, ReportsIcon } from "../icons/navIcons.jsx";

const TABS = [
  { to: "/progress", label: "Overview", icon: ProgressIcon },
  { to: "/analytics/advanced", label: "Trends", icon: AnalyticsIcon },
  { to: "/progress/prs", label: "Records", icon: MedalIcon },
  { to: "/reports/monthly", label: "Reports", icon: ReportsIcon }
];

// Shared navigation across the four analytics pages.
const AnalyticsTabs = () => (
  <nav aria-label="Analytics" className="scrollbar-none -mx-3 mb-6 overflow-x-auto px-3 sm:mx-0 sm:px-0">
    <ul className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {TABS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            className={({ isActive }) =>
              `flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                isActive ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
              }`
            }
            end
            to={to}
          >
            {({ isActive }) => (
              <>
                <Icon aria-hidden="true" className={`h-4 w-4 ${isActive ? "text-orange-300" : ""}`} />
                {label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default AnalyticsTabs;
