import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Minus, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { TodoTile } from "./TodoEditorSheet.jsx";
import { SUGGESTIONS, TODO_COLORS, countStep, formatCount, repeatLabel } from "./customTodoMeta.js";
import { GoalIcon } from "../icons/featureIcons.jsx";

const round =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-90";

const TodoRow = ({ todo, definition, onSetValue, onEdit, onEditAmount }) => {
  const reduce = useReducedMotion();
  const tone = TODO_COLORS[todo.color] || TODO_COLORS.ember;
  const step = countStep(todo.target);
  const counted = todo.type === "count";
  return (
    <motion.li
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-3 transition-colors ${todo.done ? "border-emerald-400/25 bg-emerald-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"}`}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      layout={!reduce}
    >
      <div className="flex items-center gap-3">
        <TodoTile color={todo.color} icon={todo.icon} />
        <button className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => onEdit(definition)}>
          <span className={`flex items-center gap-1.5 font-bold ${todo.done ? "text-zinc-300" : "text-white"}`}>
            <span className={`truncate ${todo.done && !counted ? "line-through decoration-emerald-400/60" : ""}`}>{todo.label}</span>
            <Pencil aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="sr-only">, edit</span>
          </span>
          <span className="block truncate text-xs text-zinc-500">{repeatLabel(definition || todo)}</span>
        </button>
        {counted ? (
          <div className="flex shrink-0 items-center gap-1">
            <button aria-label={`Take ${formatCount(step)} off ${todo.label}`} className={`${round} border-white/12 text-zinc-300 hover:bg-white/[0.06]`} disabled={todo.value <= 0} type="button" onClick={() => onSetValue(todo.id, Math.max(0, todo.value - step))}>
              <Minus aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              aria-label={`Add ${formatCount(step)} to ${todo.label}`}
              className={`${round} ${todo.done ? "border-transparent bg-gradient-to-b from-emerald-300 to-emerald-500 text-[#04140d]" : "border-orange-400/40 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20"}`}
              type="button"
              onClick={() => onSetValue(todo.id, todo.value + step)}
            >
              {todo.done ? <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} /> : <Plus aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        ) : (
          <button
            aria-label={todo.done ? `${todo.label}: done. Undo` : `Mark ${todo.label} as done`}
            aria-pressed={todo.done}
            className={`${round} ${todo.done ? "border-transparent bg-gradient-to-b from-emerald-300 to-emerald-500 text-[#04140d]" : "border-white/15 bg-white/[0.03] text-zinc-500 hover:border-orange-400/50 hover:text-orange-200"}`}
            type="button"
            onClick={() => onSetValue(todo.id, todo.done ? 0 : 1)}
          >
            <Check aria-hidden="true" className="h-5 w-5" strokeWidth={todo.done ? 3 : 2} />
          </button>
        )}
      </div>
      {counted ? (
        <div className="mt-2.5 flex items-center gap-3 pl-14">
          <span aria-hidden="true" className="block h-2 flex-1 overflow-clip rounded-full bg-white/[0.07]">
            <motion.span
              animate={{ width: `${Math.min(1, todo.value / todo.target) * 100}%` }}
              className={`block h-full rounded-full bg-gradient-to-r ${todo.done ? "from-emerald-300 to-emerald-500" : tone.bar}`}
              initial={false}
              transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
          <button
            aria-label={`Edit ${todo.label}: ${formatCount(todo.value)} of ${formatCount(todo.target)}${todo.unit ? ` ${todo.unit}` : ""}`}
            className="min-h-8 shrink-0 rounded-full px-2 text-sm tabular-nums text-zinc-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => onEditAmount(todo)}
          >
            <span className="font-bold text-white">{formatCount(todo.value)}</span> / {formatCount(todo.target)}
            {todo.unit ? ` ${todo.unit}` : ""}
          </button>
        </div>
      ) : null}
    </motion.li>
  );
};

// The user's own to-dos for today, plus the rest of their list.
const CustomTodosCard = ({ todos, definitions, limit = 30, onSetValue, onAdd, onEdit, onEditAmount, onQuickAdd }) => {
  const [showOthers, setShowOthers] = useState(false);
  const today = todos.filter((todo) => todo.kind === "custom");
  const byId = new Map(definitions.map((definition) => [String(definition._id), definition]));
  const todayIds = new Set(today.map((todo) => todo.id));
  const others = definitions.filter((definition) => !todayIds.has(String(definition._id)));
  const done = today.filter((todo) => todo.done).length;
  const atLimit = definitions.length >= limit;

  return (
    <section aria-labelledby="custom-todos-title" className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-gradient-to-b from-orange-400/15 to-forge-ember/5 text-orange-200">
          <GoalIcon aria-hidden="true" className="h-5 w-5" />
        </span>
        <h2 className="min-w-0 flex-1 font-bold text-white" id="custom-todos-title">
          Your to-dos
        </h2>
        {today.length ? (
          <p className="shrink-0 text-sm tabular-nums text-zinc-400">
            <span className="font-bold text-white">{done}</span> / {today.length}
          </p>
        ) : null}
      </header>

      {today.length ? (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {today.map((todo) => (
              <TodoRow definition={byId.get(todo.id)} key={todo.key} onEdit={onEdit} onEditAmount={onEditAmount} onSetValue={onSetValue} todo={todo} />
            ))}
          </AnimatePresence>
        </ul>
      ) : definitions.length ? (
        <p className="text-sm text-zinc-400">Nothing of yours scheduled for today.</p>
      ) : (
        <div>
          <p className="text-sm text-zinc-400">Add anything you want to do every day, on training days, or just today. Tap an idea to start from it.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:border-orange-400/40 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                key={suggestion.label}
                type="button"
                onClick={() => onQuickAdd(suggestion)}
              >
                <Plus aria-hidden="true" className="h-3 w-3" />
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-bold text-zinc-300 transition-colors hover:border-orange-400/40 hover:bg-orange-500/[0.05] hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
        disabled={atLimit}
        type="button"
        onClick={onAdd}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        {atLimit ? `You have ${limit}, the most you can have` : "Add a to-do"}
      </button>

      {others.length ? (
        <div className="mt-3">
          <button
            aria-expanded={showOthers}
            className="flex min-h-10 w-full items-center justify-between rounded-xl px-1 text-sm font-semibold text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => setShowOthers((value) => !value)}
          >
            {others.length} more on other days
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${showOthers ? "rotate-180" : ""}`} />
          </button>
          {showOthers ? (
            <ul className="mt-1 space-y-1">
              {others.map((definition) => (
                <li key={String(definition._id)}>
                  <button className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => onEdit(definition)}>
                    <TodoTile color={definition.color} icon={definition.icon} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-200">{definition.label}</span>
                      <span className="block truncate text-xs text-zinc-500">{repeatLabel(definition)}</span>
                    </span>
                    <Pencil aria-hidden="true" className="h-4 w-4 text-zinc-600" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default CustomTodosCard;
