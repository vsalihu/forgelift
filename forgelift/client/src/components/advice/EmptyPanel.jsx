import { Link } from "react-router-dom";
import { GymModeIcon } from "../icons/navIcons.jsx";

const EmptyPanel = ({ icon: Icon, title, children, action = true }) => (
  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-10 text-center">
    {Icon ? <Icon className="mx-auto h-10 w-10 text-orange-300" /> : null}
    <h2 className="font-display mt-4 text-2xl text-white">{title}</h2>
    {children ? <p className="mx-auto mt-2 max-w-md text-zinc-400">{children}</p> : null}
    {action ? (
      <Link className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02]" to="/gym-mode">
        <GymModeIcon className="h-4 w-4" />
        Start Gym Mode
      </Link>
    ) : null}
  </div>
);

export default EmptyPanel;
