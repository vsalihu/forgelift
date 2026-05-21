import {
  AlertTriangle,
  AreaChart,
  BookOpen,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  HeartPulse,
  Medal,
  Scale,
  Shield,
  ShieldAlert,
  UserCircle,
  Zap
} from "lucide-react";
import { NavLink } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet.jsx";

const groups = [
  {
    title: "Training",
    items: [
      { to: "/workouts", label: "Workout History", icon: ClipboardList },
      { to: "/workout-templates", label: "Templates", icon: ClipboardList },
      { to: "/exercises", label: "Exercise Library", icon: BookOpen },
      { to: "/strength-baselines", label: "Strength Baselines", icon: Calculator }
    ]
  },
  {
    title: "Intelligence",
    items: [
      { to: "/recovery", label: "Recovery", icon: HeartPulse },
      { to: "/overload", label: "Smart Overload", icon: Zap },
      { to: "/deload", label: "Deload", icon: ShieldAlert },
      { to: "/weak-points", label: "Weak Points", icon: AlertTriangle },
      { to: "/training-balance", label: "Training Balance", icon: Scale }
    ]
  },
  {
    title: "Progress",
    items: [
      { to: "/ranks", label: "Ranks", icon: Shield },
      { to: "/progress/prs", label: "PR Timeline", icon: Medal },
      { to: "/analytics/advanced", label: "Advanced Analytics", icon: AreaChart },
      { to: "/reports/monthly", label: "Monthly Reports", icon: FileText }
    ]
  },
  {
    title: "Account",
    items: [
      { to: "/assessment", label: "Assessment", icon: ClipboardCheck },
      { to: "/profile", label: "Profile", icon: UserCircle },
      { to: "/data-management", label: "Data Management", icon: Database }
    ]
  }
];

const MobileMoreMenu = ({ open, onClose }) => (
  <BottomSheet open={open} title="More ForgeLift" onClose={onClose}>
    <div className="space-y-5">
      {groups.map((group) => (
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
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  </BottomSheet>
);

export default MobileMoreMenu;
