import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Avatar from "../social/Avatar.jsx";
import { describeBoard, describeDivision, formatScore } from "./boards.js";
import { FirstPlaceIcon } from "../icons/featureIcons.jsx";

const EMPTY_HINTS = {
  volume: "Log a workout to get on this board.",
  prs: "Beat one of your previous bests to get on this board.",
  progress: "Get stronger on a lift you trained before this period started.",
  weight_loss: "Log your bodyweight at least twice. Weigh-ins are on your Dashboard and Profile.",
  weight_gain: "Log your bodyweight at least twice. Weigh-ins are on your Dashboard and Profile."
};

const PODIUM = {
  1: { height: "pt-6 pb-5", ring: "border-amber-300/50 from-amber-300/[0.16]", text: "text-amber-300", order: "order-2" },
  2: { height: "pt-4 pb-4 mt-6", ring: "border-zinc-300/30 from-zinc-300/[0.08]", text: "text-zinc-300", order: "order-1" },
  3: { height: "pt-4 pb-4 mt-9", ring: "border-orange-700/50 from-orange-700/[0.14]", text: "text-orange-400", order: "order-3" }
};

const location = (entry, scope) => (scope === "city" ? "" : scope === "country" ? entry.cityName : `${entry.cityName}, ${entry.countryName}`);

const LeaderboardView = ({ leaderboard, unit, viewerDivision }) => {
  const reduce = useReducedMotion();
  const { board, entries, me, rankedCount, viewerInDivision } = leaderboard;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      <section className="relative overflow-clip rounded-[2rem] border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.14] via-white/[0.02] to-transparent p-5 sm:p-6">
        <p className="text-sm text-zinc-400">{describeBoard(board)}</p>
        {me ? (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <p className="font-display text-6xl leading-none tabular-nums text-white">
              #{me.place}
              <span className="ml-2 font-sans text-base font-semibold text-zinc-400">of {rankedCount}</span>
            </p>
            <p className="text-right">
              <span className="block text-xs font-bold uppercase tracking-[0.14em] text-orange-300">Your score</span>
              <span className="font-display text-2xl tabular-nums text-white">{formatScore(board.type, me.score, unit)}</span>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-base leading-7 text-zinc-200">
            {!viewerInDivision ? (
              <>
                You&apos;re not in this division. You compete in <span className="font-bold text-white">{viewerDivision}</span>.
              </>
            ) : (
              <>You&apos;re not on this board yet. {EMPTY_HINTS[board.type]}</>
            )}
          </p>
        )}
      </section>

      {!entries.length ? (
        <div className="rounded-3xl border border-dashed border-white/12 p-8 text-center">
          <p className="font-display text-xl text-white">Nobody here yet.</p>
          <p className="mt-1 text-sm text-zinc-400">Be the first, or try a bigger area or a longer period.</p>
        </div>
      ) : (
        <>
          <ol aria-label="Top three" className="grid grid-cols-3 items-start gap-2 sm:gap-3">
            {podium.map((entry, index) => {
              const style = PODIUM[entry.place] || PODIUM[3];
              return (
                <motion.li
                  animate={{ opacity: 1, y: 0 }}
                  className={style.order}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  key={entry.userId}
                  transition={{ duration: 0.5, delay: [0.15, 0, 0.25][index], ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    className={`flex flex-col items-center rounded-3xl border bg-gradient-to-b to-transparent px-2 text-center transition-colors hover:border-forge-ember/60 ${style.ring} ${style.height} ${entry.isMe ? "ring-2 ring-forge-ember" : ""}`}
                    to={`/u/${entry.username}`}
                  >
                    {entry.place === 1 ? <FirstPlaceIcon aria-hidden="true" className="mb-1 h-6 w-6 text-amber-300" /> : null}
                    <Avatar name={entry.name} rank={entry.rank} self={entry.isMe} size={entry.place === 1 ? "lg" : "md"} />
                    <span className={`font-display mt-2 text-lg leading-none ${style.text}`}>#{entry.place}</span>
                    <span className="mt-1 w-full truncate text-sm font-bold text-white">{entry.isMe ? "You" : entry.name}</span>
                    <span className="w-full truncate text-xs text-zinc-500">@{entry.username}</span>
                    <span className="mt-2 text-sm font-bold tabular-nums text-white sm:text-base">{formatScore(board.type, entry.score, unit)}</span>
                    {location(entry, board.scope) ? <span className="mt-0.5 hidden w-full truncate text-xs text-zinc-600 sm:block">{location(entry, board.scope)}</span> : null}
                  </Link>
                </motion.li>
              );
            })}
          </ol>

          {rest.length ? (
            <ol className="space-y-1.5">
              {rest.map((entry) => (
                <li key={entry.userId}>
                  <Link
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors hover:bg-white/[0.05] sm:px-4 ${
                      entry.isMe ? "border-forge-ember/40 bg-forge-ember/[0.07]" : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                    to={`/u/${entry.username}`}
                  >
                    <span className="w-9 shrink-0 text-center text-sm font-black tabular-nums text-zinc-400">#{entry.place}</span>
                    <Avatar name={entry.name} rank={entry.rank} self={entry.isMe} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{entry.isMe ? `${entry.name} (you)` : entry.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        @{entry.username}
                        {location(entry, board.scope) ? ` · ${location(entry, board.scope)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-bold tabular-nums text-white">{formatScore(board.type, entry.score, unit)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}

          {me && me.place > entries.length ? <p className="text-center text-xs text-zinc-500">Showing the top {entries.length}. You&apos;re #{me.place}.</p> : null}
        </>
      )}
    </div>
  );
};

export const viewerDivisionLabel = (competition) => describeDivision(competition.genderDivision || "open", competition.ageGroup || "all");

export default LeaderboardView;
