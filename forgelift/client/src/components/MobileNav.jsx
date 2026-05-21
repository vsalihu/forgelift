import { Dumbbell, Gauge, ListChecks, Menu, PlusCircle } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import MobileMoreMenu from "./layout/MobileMoreMenu.jsx";

const items = [
  { to: "/dashboard", label: "Home", icon: Gauge },
  { to: "/gym-mode", label: "Gym", icon: Dumbbell },
  { to: "/workouts/new", label: "Log", icon: PlusCircle },
  { to: "/missions", label: "Missions", icon: ListChecks }
];

const MobileNav = () => {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-forge-black/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition ${
                  isActive
                    ? item.to === "/gym-mode"
                      ? "bg-forge-ember text-white shadow-lg shadow-orange-900/30"
                      : "bg-white/12 text-white"
                    : item.to === "/gym-mode"
                      ? "text-forge-copper"
                      : "text-slate-300"
                }`
              }
              key={item.to}
              to={item.to}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            type="button"
            onClick={() => setMoreOpen(true)}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
};

export default MobileNav;
