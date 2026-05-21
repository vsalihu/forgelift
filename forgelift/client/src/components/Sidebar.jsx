import {
  AlertTriangle,
  AreaChart,
  BookOpen,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  Database,
  Dumbbell,
  Gauge,
  HeartPulse,
  Medal,
  PlusCircle,
  ListChecks,
  FileText,
  Scale,
  ShieldAlert,
  Shield,
  TrendingUp,
  UserCircle,
  X,
  Zap
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    section: "Main",
    accent: "text-cyan-300",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Gauge },
      { to: "/gym-mode", label: "Gym Mode", icon: Dumbbell },
      { to: "/workouts/new", label: "Log Workout", icon: PlusCircle }
    ]
  },
  {
    section: "Training",
    accent: "text-emerald-300",
    items: [
      { to: "/workouts", label: "Workout History", icon: ClipboardList },
      { to: "/workout-templates", label: "Workout Templates", icon: ClipboardList },
      { to: "/exercises", label: "Exercise Library", icon: BookOpen },
      { to: "/strength-baselines", label: "Strength Baselines", icon: Calculator }
    ]
  },
  {
    section: "Intelligence",
    accent: "text-violet-300",
    items: [
      { to: "/recovery", label: "Recovery", icon: HeartPulse },
      { to: "/overload", label: "Smart Overload", icon: Zap },
      { to: "/deload", label: "Deload", icon: ShieldAlert },
      { to: "/weak-points", label: "Weak Points", icon: AlertTriangle },
      { to: "/training-balance", label: "Training Balance", icon: Scale }
    ]
  },
  {
    section: "Progress",
    accent: "text-amber-300",
    items: [
      { to: "/ranks", label: "Ranks", icon: Shield },
      { to: "/missions", label: "Missions", icon: ListChecks },
      { to: "/progress", label: "Progress", icon: TrendingUp },
      { to: "/progress/prs", label: "PR Timeline", icon: Medal },
      { to: "/analytics/advanced", label: "Advanced Analytics", icon: AreaChart },
      { to: "/reports/monthly", label: "Monthly Reports", icon: FileText }
    ]
  },
  {
    section: "Account",
    accent: "text-slate-300",
    items: [
      { to: "/assessment", label: "Assessment", icon: ClipboardCheck },
      { to: "/profile", label: "Profile", icon: UserCircle },
      { to: "/data-management", label: "Data Management", icon: Database }
    ]
  }
];

const Sidebar = ({ open, onClose }) => {
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
          <span className="font-bold text-white">Navigation</span>
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
