import { Link } from "react-router-dom";
import RankBadge from "../ranks/RankBadge.jsx";
import { describeBoard, describeDivision, formatScore } from "./boards.js";
import { FirstPlaceIcon, MedalIcon } from "../icons/featureIcons.jsx";

const PODIUM_STYLES = [
  "border-amber-300/50 bg-gradient-to-b from-amber-300/15 to-transparent",
  "border-slate-300/40 bg-gradient-to-b from-slate-300/10 to-transparent",
  "border-orange-700/50 bg-gradient-to-b from-orange-700/15 to-transparent"
];

const EMPTY_HINTS = {
  volume: "Log a workout to get on this board.",
  prs: "Beat one of your previous bests to get on this board.",
  progress: "Get stronger on a lift you trained before this period started.",
  weight_loss: "Log your bodyweight at least twice. Weigh-ins are on your Dashboard and Profile.",
  weight_gain: "Log your bodyweight at least twice. Weigh-ins are on your Dashboard and Profile."
};

const location = (entry, scope) => (scope === "city" ? "" : scope === "country" ? entry.cityName : `${entry.cityName}, ${entry.countryName}`);

const Avatar = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
    {(name || "?").slice(0, 1).toUpperCase()}
  </span>
);

const LeaderboardView = ({ leaderboard, unit, viewerDivision }) => {
  const { board, entries, me, rankedCount, viewerInDivision } = leaderboard;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">{describeBoard(board)}</p>

      <div className="rounded-xl border border-forge-ember/30 bg-forge-ember/10 p-4">
        {me ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">Your place</p>
              <p className="mt-1 text-3xl font-black text-white">
                #{me.place} <span className="text-base font-semibold text-slate-300">of {rankedCount}</span>
              </p>
            </div>
            <p className="text-right text-lg font-black text-white">{formatScore(board.type, me.score, unit)}</p>
          </div>
        ) : !viewerInDivision ? (
          <p className="text-sm leading-6 text-slate-200">
            You&apos;re not in this division. You compete in <span className="font-bold text-white">{viewerDivision}</span>.
          </p>
        ) : (
          <p className="text-sm leading-6 text-slate-200">
            You&apos;re not on this board yet. {EMPTY_HINTS[board.type]}
          </p>
        )}
      </div>

      {!entries.length ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
          <p className="font-bold text-white">Nobody on this board yet.</p>
          <p className="mt-1 text-sm text-slate-400">Be the first. Try a bigger area (Country or World) or a different period too.</p>
        </div>
      ) : (
        <>
          <ol className="grid gap-3 sm:grid-cols-3">
            {podium.map((entry, index) => (
              <li key={entry.userId}>
                <Link
                  className={`flex h-full flex-col items-center rounded-xl border p-4 text-center transition hover:border-forge-ember/60 ${PODIUM_STYLES[index]} ${
                    entry.isMe ? "ring-2 ring-forge-ember" : ""
                  }`}
                  to={`/u/${entry.username}`}
                >
                  {entry.place === 1 ? <FirstPlaceIcon className="h-6 w-6 text-amber-300" /> : <MedalIcon className="h-6 w-6 text-slate-300" />}
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{entry.place}</p>
                  <p className="mt-1 truncate text-lg font-black text-white">{entry.isMe ? "You" : entry.name}</p>
                  <p className="truncate text-xs text-slate-400">@{entry.username}</p>
                  <p className="mt-3 text-xl font-black text-white">{formatScore(board.type, entry.score, unit)}</p>
                  {location(entry, board.scope) ? <p className="mt-1 text-xs text-slate-500">{location(entry, board.scope)}</p> : null}
                </Link>
              </li>
            ))}
          </ol>

          {rest.length ? (
            <ol className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-black/20">
              {rest.map((entry) => (
                <li key={entry.userId}>
                  <Link
                    className={`flex items-center gap-3 px-3 py-3 transition hover:bg-white/5 sm:px-4 ${entry.isMe ? "bg-forge-ember/10" : ""}`}
                    to={`/u/${entry.username}`}
                  >
                    <span className="w-8 shrink-0 text-center text-sm font-black tabular-nums text-slate-300">#{entry.place}</span>
                    <Avatar name={entry.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-white">{entry.isMe ? `${entry.name} (you)` : entry.name}</span>
                      <span className="block truncate text-xs text-slate-400">
                        @{entry.username}
                        {location(entry, board.scope) ? ` · ${location(entry, board.scope)}` : ""}
                      </span>
                    </span>
                    <RankBadge className="hidden sm:inline-flex" rank={entry.rank} />
                    <span className="shrink-0 text-right text-sm font-black text-white">{formatScore(board.type, entry.score, unit)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}

          {me && me.place > entries.length ? (
            <p className="text-center text-xs text-slate-500">Showing the top {entries.length}. You&apos;re #{me.place}.</p>
          ) : null}
        </>
      )}
    </div>
  );
};

export const viewerDivisionLabel = (competition) =>
  describeDivision(competition.genderDivision || "open", competition.ageGroup || "all");

export default LeaderboardView;
