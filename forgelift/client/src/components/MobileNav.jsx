import { CalendarDays, Dumbbell, Gauge, Menu, PlusCircle } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import MobileMoreMenu, { moreMenuGroups } from "./layout/MobileMoreMenu.jsx";
import UnreadBadge from "./ui/UnreadBadge.jsx";

const items = [
  { to: "/dashboard", label: "Home", icon: Gauge },
  { to: "/gym-mode", label: "Gym", icon: Dumbbell },
  { to: "/workouts/new", label: "Log", icon: PlusCircle },
  { to: "/calendar", label: "Calendar", icon: CalendarDays }
];

const morePaths = moreMenuGroups.flatMap((group) => group.items.map((item) => item.to));

const MobileNav = ({ unreadMessages = 0 }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const isMoreActive = morePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-forge-black/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition ${
                  isActive ? "bg-forge-ember text-white shadow-lg shadow-orange-900/30" : "text-slate-300"
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
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition ${
              isMoreActive ? "bg-forge-ember text-white shadow-lg shadow-orange-900/30" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            type="button"
            onClick={() => setMoreOpen(true)}
          >
            <Menu className="h-5 w-5" />
            More
            {unreadMessages ? (
              <UnreadBadge className="absolute right-2 top-1" count={unreadMessages} />
            ) : null}
          </button>
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} unreadMessages={unreadMessages} onClose={() => setMoreOpen(false)} />
    </>
  );
};

export default MobileNav;
