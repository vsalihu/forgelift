import { NavLink } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet.jsx";
import UnreadBadge from "../ui/UnreadBadge.jsx";
import {
  AnalyticsIcon,
  AssessmentIcon,
  BalanceIcon,
  BaselinesIcon,
  CalendarIcon,
  ChatIcon,
  DataIcon,
  DeloadIcon,
  DesignWorkoutIcon,
  ExerciseLibraryIcon,
  FriendsIcon,
  HistoryIcon,
  LogWorkoutIcon,
  MissionsIcon,
  OverloadIcon,
  PrTimelineIcon,
  ProfileIcon,
  RanksIcon,
  RecoveryIcon,
  ReportsIcon,
  TrainingLoadIcon,
  WeakPointsIcon
} from "../icons/navIcons.jsx";

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
  <BottomSheet open={open} title="More ForgeLift" onClose={onClose}>
    <div className="space-y-5">
      {moreMenuGroups.map((group) => (
        <section key={group.title}>
          <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{group.title}</p>
          <div className="grid gap-2">
            {group.items.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
                    isActive ? "bg-forge-ember text-white" : "bg-white/10 text-slate-200 hover:bg-white/15"
                  }`
                }
                key={item.to}
                to={item.to}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 shrink-0 text-forge-copper" />
                {item.label}
                {item.to === "/chat" ? <UnreadBadge className="ml-auto" count={unreadMessages} /> : null}
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  </BottomSheet>
);

export default MobileMoreMenu;
