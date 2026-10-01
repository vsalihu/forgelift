import { Link } from "react-router-dom";
import { SuccessIcon } from "../icons/featureIcons.jsx";
import { GymModeIcon } from "../icons/navIcons.jsx";
import Avatar from "./Avatar.jsx";

// A workout a friend sent you or made public: save it, or train it right away.
const SharedWorkoutCard = ({ from, name, description, exercises = [], saved, busy, onSave, onStart, label = "From" }) => (
  <article className="flex flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4">
    <div className="flex items-center gap-2.5">
      <Avatar name={from?.name} rank={from?.currentOverallRank} size="sm" />
      <p className="min-w-0 truncate text-sm text-zinc-400">
        {label}{" "}
        <Link className="font-semibold text-zinc-200 hover:underline" to={`/u/${from?.username}`}>
          {from?.name || "a friend"}
        </Link>
      </p>
    </div>
    <h3 className="font-display mt-3 break-words text-xl leading-tight text-white">{name}</h3>
    {description ? <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p> : null}
    {exercises.length ? (
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {exercises.slice(0, 6).map((exercise) => (
          <li className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-300" key={exercise.exerciseName}>
            {exercise.exerciseName}
          </li>
        ))}
        {exercises.length > 6 ? <li className="px-1 text-xs text-zinc-500">+{exercises.length - 6} more</li> : null}
      </ul>
    ) : null}
    <div className="mt-auto flex gap-2 pt-4">
      <button
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 text-sm font-bold text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        type="button"
        onClick={onStart}
      >
        <GymModeIcon className="h-4 w-4" />
        Train it
      </button>
      <button
        className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-default ${
          saved ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" : "border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
        }`}
        disabled={saved || busy}
        type="button"
        onClick={onSave}
      >
        {saved ? <SuccessIcon className="h-4 w-4" /> : null}
        {saved ? "Saved" : busy ? "Saving…" : "Save"}
      </button>
    </div>
  </article>
);

export default SharedWorkoutCard;
