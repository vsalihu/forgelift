import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { rankSrc } from "./landing/shared.jsx";
import PlaceBadge from "./compete/PlaceBadge.jsx";
import UnreadBadge from "./ui/UnreadBadge.jsx";
import { AnalyticsIcon, AssessmentIcon, BalanceIcon, BaselinesIcon, CalendarIcon, ChatIcon, CompeteIcon, DashboardIcon, DataIcon, DeloadIcon, DesignWorkoutIcon, ExerciseLibraryIcon, FriendsIcon, GymModeIcon, HistoryIcon, LogWorkoutIcon, MissionsIcon, OverloadIcon, PrTimelineIcon, ProfileIcon, ProgressIcon, RanksIcon, RecoveryIcon, ReportsIcon, TrainingLoadIcon, WeakPointsIcon } from "./icons/navIcons.jsx";

const navItems = [
  {
    section: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { to: "/gym-mode", label: "Gym Mode", icon: GymModeIcon },
      { to: "/workouts/new", label: "Log Workout", icon: LogWorkoutIcon },
      { to: "/compete", label: "Compete", icon: CompeteIcon }
    ]
  },
  {
    section: "Training",
    items: [
      { to: "/calendar", label: "Calendar", icon: CalendarIcon },
      { to: "/workouts", label: "Workout History", icon: HistoryIcon },
      { to: "/workout-templates", label: "Design a Workout", icon: DesignWorkoutIcon },
      { to: "/exercises", label: "Exercise Library", icon: ExerciseLibraryIcon },
      { to: "/strength-baselines", label: "Strength Baselines", icon: BaselinesIcon }
    ]
  },
  {
    section: "Intelligence",
    items: [
      { to: "/recovery", label: "Recovery", icon: RecoveryIcon },
      { to: "/training-load", label: "Training Load", icon: TrainingLoadIcon },
      { to: "/overload", label: "Smart Overload", icon: OverloadIcon },
      { to: "/deload", label: "Deload", icon: DeloadIcon },
      { to: "/weak-points", label: "Weak Points", icon: WeakPointsIcon },
      { to: "/training-balance", label: "Training Balance", icon: BalanceIcon }
    ]
  },
  {
    section: "Social",
    items: [
      { to: "/friends", label: "Friends", icon: FriendsIcon },
      { to: "/chat", label: "Chat", icon: ChatIcon }
    ]
  },
  {
    section: "Progress",
    items: [
      { to: "/ranks", label: "Ranks", icon: RanksIcon },
      { to: "/missions", label: "Missions", icon: MissionsIcon },
      { to: "/progress", label: "Progress", icon: ProgressIcon },
      { to: "/progress/prs", label: "PR Timeline", icon: PrTimelineIcon },
      { to: "/analytics/advanced", label: "Analytics", icon: AnalyticsIcon },
      { to: "/reports/monthly", label: "Monthly Reports", icon: ReportsIcon }
    ]
  },
  {
    section: "Account",
    items: [
      { to: "/assessment", label: "Assessment", icon: AssessmentIcon },
      { to: "/profile", label: "Profile", icon: ProfileIcon },
      { to: "/data-management", label: "Data Management", icon: DataIcon }
    ]
  }
];

// Desktop navigation. Phones and tablets use the bottom bar and its More sheet instead.
const Sidebar = ({ unreadMessages = 0, competePlace = null }) => {
  const { user } = useAuth();
  const rank = user?.currentOverallRank || "Copper";

  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-white/[0.06] lg:flex">
      <nav aria-label="Main" className="scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-3 text-xs font-semibold text-zinc-500">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  end={item.to === "/workouts" || item.to === "/progress"}
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      isActive
                        ? "bg-gradient-to-r from-forge-ember/[0.16] to-transparent text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-forge-ember before:shadow-[0_0_12px_rgba(249,115,22,0.9)]"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-orange-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      <span className="truncate">{item.label}</span>
                      {item.to === "/chat" ? <UnreadBadge className="ml-auto" count={unreadMessages} /> : null}
                      {item.to === "/compete" ? <PlaceBadge className="ml-auto" place={competePlace} /> : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Link
        className="m-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition-colors hover:border-forge-ember/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        to="/ranks"
      >
        <img alt="" className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_6px_16px_rgba(249,115,22,0.35)]" height="320" src={rankSrc(rank)} width="320" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">{user?.name || "Your rank"}</span>
          <span className="block text-xs text-zinc-400">{rank} rank</span>
        </span>
      </Link>
    </aside>
  );
};

export default Sidebar;
