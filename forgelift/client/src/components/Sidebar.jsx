import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import PlaceBadge from "./compete/PlaceBadge.jsx";
import UnreadBadge from "./ui/UnreadBadge.jsx";
import {
  AnalyticsIcon,
  AssessmentIcon,
  BalanceIcon,
  BaselinesIcon,
  CalendarIcon,
  ChatIcon,
  CompeteIcon,
  DashboardIcon,
  DataIcon,
  DeloadIcon,
  DesignWorkoutIcon,
  ExerciseLibraryIcon,
  FriendsIcon,
  GymModeIcon,
  HistoryIcon,
  LogWorkoutIcon,
  MissionsIcon,
  OverloadIcon,
  PrTimelineIcon,
  ProfileIcon,
  ProgressIcon,
  RanksIcon,
  RecoveryIcon,
  ReportsIcon,
  TrainingLoadIcon,
  WeakPointsIcon
} from "./icons/navIcons.jsx";

const navItems = [
  {
    section: "Main",
    accent: "text-cyan-300",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { to: "/gym-mode", label: "Gym Mode", icon: GymModeIcon },
      { to: "/workouts/new", label: "Log Workout", icon: LogWorkoutIcon },
      { to: "/compete", label: "Compete", icon: CompeteIcon }
    ]
  },
  {
    section: "Training",
    accent: "text-emerald-300",
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
    accent: "text-violet-300",
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
    accent: "text-pink-300",
    items: [
      { to: "/friends", label: "Friends", icon: FriendsIcon },
      { to: "/chat", label: "Chat", icon: ChatIcon }
    ]
  },
  {
    section: "Progress",
    accent: "text-amber-300",
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
    accent: "text-slate-300",
    items: [
      { to: "/assessment", label: "Assessment", icon: AssessmentIcon },
      { to: "/profile", label: "Profile", icon: ProfileIcon },
      { to: "/data-management", label: "Data Management", icon: DataIcon }
    ]
  }
];

const Sidebar = ({ open, onClose, unreadMessages = 0, competePlace = null }) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r border-white/10 bg-forge-panel p-5 transition-transform lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex shrink-0 items-center justify-between lg:hidden">
          <img alt="ForgeLift" className="h-7 w-auto" src="/logo-full.png" />
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 [scrollbar-color:rgba(148,163,184,0.45)_rgba(15,23,42,0.45)] [scrollbar-width:thin]">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className={`mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] ${group.accent || "text-slate-500"}`}>
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-forge-ember text-white shadow-lg shadow-orange-950/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.to === "/chat" ? <UnreadBadge className="ml-auto" count={unreadMessages} /> : null}
                    {item.to === "/compete" ? <PlaceBadge className="ml-auto" place={competePlace} /> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
