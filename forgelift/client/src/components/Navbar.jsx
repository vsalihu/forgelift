import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { ChatIcon, LogoutIcon, ProfileIcon } from "./icons/navIcons.jsx";
import UnreadBadge from "./ui/UnreadBadge.jsx";

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "F";

const ProfileMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && ref.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-forge-copper text-xs font-black text-[#160a02]">
          {initialsOf(user.name)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-zinc-200 sm:block">{user.name}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0e1014]/95 p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          role="menu"
        >
          <div className="px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            {user.username ? <p className="truncate text-xs text-zinc-500">@{user.username}</p> : null}
          </div>
          <Link className={item} role="menuitem" to="/profile" onClick={() => setOpen(false)}>
            <ProfileIcon className="h-4 w-4 text-zinc-400" />
            Profile and settings
          </Link>
          {user.username ? (
            <Link className={item} role="menuitem" to={`/u/${user.username}`} onClick={() => setOpen(false)}>
              <span aria-hidden="true" className="w-4 text-center text-zinc-400">@</span>
              Public profile
            </Link>
          ) : null}
          <div className="my-1 h-px bg-white/[0.06]" />
          <button className={item} role="menuitem" type="button" onClick={onLogout}>
            <LogoutIcon className="h-4 w-4 text-zinc-400" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
};

const Navbar = ({ unreadMessages = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080a]/75 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-6">
        <Link aria-label="ForgeLift home" className="flex shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" to={user ? "/dashboard" : "/"}>
          <img alt="ForgeLift" className="h-7 w-auto" height="362" src="/logo-full.png" width="1357" />
        </Link>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              aria-label={unreadMessages ? `Chat, ${unreadMessages} unread` : "Chat"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              to="/chat"
            >
              <ChatIcon className="h-5 w-5" />
              <UnreadBadge className="absolute -right-0.5 -top-0.5" count={unreadMessages} />
            </Link>
            <ProfileMenu user={user} onLogout={handleLogout} />
          </div>
        ) : (
          <nav className="flex items-center gap-2">
            <Link className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]" to="/login">
              Log in
            </Link>
            <Link
              className="rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 py-2 text-sm font-bold text-[#160a02] shadow-[0_10px_30px_-12px_rgba(249,115,22,0.9)]"
              to="/register"
            >
              Start training free
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
