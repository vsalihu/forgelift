import { NavLink } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet.jsx";
import UnreadBadge from "../ui/UnreadBadge.jsx";
import { AnalyticsIcon, AssessmentIcon, BalanceIcon, BaselinesIcon, CalendarIcon, ChatIcon, DataIcon, DeloadIcon, DesignWorkoutIcon, ExerciseLibraryIcon, FriendsIcon, HistoryIcon, LogWorkoutIcon, MissionsIcon, OverloadIcon, PrTimelineIcon, ProfileIcon, RanksIcon, RecoveryIcon, ReportsIcon, TrainingLoadIcon, WeakPointsIcon } from "../icons/navIcons.jsx";

export const moreMenuGroups = [
  {
    title: "Training",
    items: [
      { to: "/workouts/new", label: "Log Workout", icon: LogWorkoutIcon },
      { to: "/calendar", label: "Calendar", icon: CalendarIcon },
      { to: "/workouts", label: "Workout History", icon: HistoryIcon },
      { to: "/workout-templates", label: "Design a Workout", icon: DesignWorkoutIcon },
      { to: "/exercises", label: "Exercise Library", icon: ExerciseLibraryIcon },
      { to: "/strength-baselines", label: "Strength Baselines", icon: BaselinesIcon }
    ]
  },
  {
    title: "Intelligence",
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
    title: "Social",
    items: [
      { to: "/friends", label: "Friends", icon: FriendsIcon },
      { to: "/chat", label: "Chat", icon: ChatIcon }
    ]
  },
  {
    title: "Progress",
    items: [
      { to: "/ranks", label: "Ranks", icon: RanksIcon },
      { to: "/missions", label: "Missions", icon: MissionsIcon },
      { to: "/progress/prs", label: "PR Timeline", icon: PrTimelineIcon },
      { to: "/analytics/advanced", label: "Analytics", icon: AnalyticsIcon },
      { to: "/reports/monthly", label: "Monthly Reports", icon: ReportsIcon }
    ]
  },
  {
    title: "Account",
    items: [
      { to: "/assessment", label: "Assessment", icon: AssessmentIcon },
      { to: "/profile", label: "Profile", icon: ProfileIcon },
      { to: "/data-management", label: "Data Management", icon: DataIcon }
    ]
  }
];

const MobileMoreMenu = ({ open, onClose, unreadMessages = 0 }) => (
  <BottomSheet open={open} title="Everything in ForgeLift" onClose={onClose}>
    <div className="space-y-6">
      {moreMenuGroups.map((group) => (
        <section key={group.title}>
          <p className="mb-2 px-1 text-xs font-semibold text-zinc-500">{group.title}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.items.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `relative flex min-h-[4.5rem] flex-col justify-between gap-2 rounded-2xl border p-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    isActive ? "border-forge-ember/50 bg-forge-ember/[0.12] text-white" : "border-white/[0.07] bg-white/[0.03] text-zinc-200 hover:border-white/20"
                  }`
                }
                end={item.to === "/workouts"}
                key={item.to}
                to={item.to}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 text-orange-300" />
                <span className="leading-tight">{item.label}</span>
                {item.to === "/chat" ? <UnreadBadge className="absolute right-3 top-3" count={unreadMessages} /> : null}
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  </BottomSheet>
);

export default MobileMoreMenu;
