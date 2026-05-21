import { Dumbbell, LogOut, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Button from "./Button.jsx";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forge-black/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {user ? (
            <button
              className="rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <Link className="flex items-center gap-2 text-lg font-black text-white" to={user ? "/dashboard" : "/"}>
            <span className="rounded-md bg-forge-ember p-2 text-white">
              <Dumbbell className="h-5 w-5" />
            </span>
            ForgeLift
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 xl:flex">
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                to="/gym-mode"
              >
                Gym Mode
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                to="/workouts/new"
              >
                Log Workout
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                to="/recovery"
              >
                Recovery
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                to="/missions"
              >
                Missions
              </Link>
            </nav>
            <span className="hidden text-sm text-forge-steel sm:inline">{user.name}</span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/login">
              Login
            </Link>
            <Link
              className="rounded-md bg-forge-ember px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              to="/register"
            >
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
