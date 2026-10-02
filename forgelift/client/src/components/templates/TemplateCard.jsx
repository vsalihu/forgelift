import { motion, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import RowMenu from "../ui/RowMenu.jsx";
import { PlayIcon, PrivateIcon, WorldIcon } from "../icons/featureIcons.jsx";
import { FriendsIcon } from "../icons/navIcons.jsx";

const repsLabel = (item) =>
  item.targetRepMin && item.targetRepMax ? (item.targetRepMin === item.targetRepMax ? `${item.targetRepMin}` : `${item.targetRepMin}-${item.targetRepMax}`) : "";

const TemplateCard = ({ template, index = 0, topMuscles = [], busy, onStart, onEdit, onToggleVisibility, onSend, onDelete }) => {
  const reduce = useReducedMotion();
  const exercises = template.exercises || [];
  const totalSets = exercises.reduce((total, item) => total + (Number(item.targetSets) || 0), 0);
  const isPublic = template.visibility === "public";

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-snug text-white [overflow-wrap:anywhere]">{template.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
            <span className="tabular-nums">
              {exercises.length} exercise{exercises.length === 1 ? "" : "s"} · {totalSets} sets
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${isPublic ? "bg-sky-400/10 text-sky-200" : "bg-white/[0.06] text-zinc-400"}`}>
              {isPublic ? <WorldIcon aria-hidden="true" className="h-3.5 w-3.5" /> : <PrivateIcon aria-hidden="true" className="h-3.5 w-3.5" />}
              {isPublic ? "Public" : "Private"}
            </span>
          </p>
        </div>
        <RowMenu
          items={[
            {
              label: isPublic ? "Make private" : "Make public",
              icon: isPublic ? PrivateIcon : WorldIcon,
              onClick: () => onToggleVisibility(template)
            },
            { label: "Send to a friend", icon: FriendsIcon, onClick: () => onSend(template) },
            { label: "Delete", icon: Trash2, tone: "danger", onClick: () => onDelete(template._id) }
          ]}
          label={`More for ${template.name}`}
        />
      </div>

      {template.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{template.description}</p> : null}

      {topMuscles.length ? (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {topMuscles.map((muscle) => (
            <span className="rounded-full border border-forge-ember/20 bg-forge-ember/[0.07] px-2.5 py-0.5 text-xs font-semibold text-orange-200" key={muscle}>
              {muscle}
            </span>
          ))}
        </p>
      ) : null}

      <ol className="mt-4 flex-1 space-y-1.5 text-sm">
        {exercises.slice(0, 4).map((item, itemIndex) => (
          <li className="flex items-baseline justify-between gap-3" key={`${item.exerciseName}-${itemIndex}`}>
            <span className="min-w-0 truncate text-zinc-200">{item.exerciseName}</span>
            <span className="shrink-0 tabular-nums text-zinc-500">
              {item.targetSets} × {repsLabel(item)}
            </span>
          </li>
        ))}
        {exercises.length > 4 ? <li className="text-xs text-zinc-500">+{exercises.length - 4} more</li> : null}
      </ol>

      <div className="mt-5 flex gap-2">
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
          disabled={!exercises.length || busy}
          type="button"
          onClick={() => onStart(template)}
        >
          <PlayIcon aria-hidden="true" className="h-4 w-4" />
          Start
        </button>
        <button
          className="min-h-11 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          type="button"
          onClick={() => onEdit(template)}
        >
          Edit
        </button>
      </div>
    </motion.article>
  );
};

export default TemplateCard;
