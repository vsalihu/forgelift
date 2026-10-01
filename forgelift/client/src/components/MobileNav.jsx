import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import MobileMoreMenu, { moreMenuGroups } from "./layout/MobileMoreMenu.jsx";
import PlaceBadge from "./compete/PlaceBadge.jsx";
import UnreadBadge from "./ui/UnreadBadge.jsx";
import { CalendarIcon, CompeteIcon, DashboardIcon, GymModeIcon, MoreIcon } from "./icons/navIcons.jsx";

const items = [
  { to: "/dashboard", label: "Home", icon: DashboardIcon },
  { to: "/gym-mode", label: "Gym", icon: GymModeIcon },
  { to: "/compete", label: "Compete", icon: CompeteIcon },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon }
];

// Pages already on the bottom bar don't also light up "More".
const morePaths = moreMenuGroups.flatMap((group) => group.items.map((item) => item.to)).filter((path) => !items.some((item) => item.to === path));

const MobileNav = ({ unreadMessages = 0, competePlace = null }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const isMoreActive = morePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const tab = (active) =>
    `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
      active ? "text-white" : "text-zinc-400 hover:text-white"
    }`;
  const iconWrap = (active) =>
    `flex h-8 w-12 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-300 ${
      active ? "bg-forge-ember/20 text-orange-300 shadow-[0_0_18px_-4px_rgba(249,115,22,0.8)]" : ""
    }`;

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#0a0b0e]/85 px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {items.map((item) => (
            <NavLink className={({ isActive }) => tab(isActive)} key={item.to} to={item.to}>
              {({ isActive }) => (
                <>
                  <span className={iconWrap(isActive)}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  {item.label}
                  {item.to === "/compete" ? <PlaceBadge className="absolute right-1.5 top-0.5" place={competePlace} /> : null}
                </>
              )}
            </NavLink>
          ))}
          <button aria-expanded={moreOpen} className={tab(isMoreActive)} type="button" onClick={() => setMoreOpen(true)}>
            <span className={iconWrap(isMoreActive)}>
              <MoreIcon className="h-5 w-5" />
            </span>
            More
            {unreadMessages ? <UnreadBadge className="absolute right-1.5 top-0.5" count={unreadMessages} /> : null}
          </button>
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} unreadMessages={unreadMessages} onClose={() => setMoreOpen(false)} />
    </>
  );
};

export default MobileNav;
