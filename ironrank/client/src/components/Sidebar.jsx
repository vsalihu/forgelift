import { Gauge, UserCircle, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/profile", label: "Profile", icon: UserCircle }
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-white/10 bg-iron-panel p-5 transition-transform lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <span className="font-bold text-white">Navigation</span>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-iron-ember text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
