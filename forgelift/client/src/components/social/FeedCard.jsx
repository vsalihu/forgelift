import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import { timeAgo } from "./timeAgo.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const FeedCard = ({ item, isSelf }) => {
  const person = item.userId || {};
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4">
      <div className="flex items-start gap-3">
        <Link aria-label={`${person.name}'s profile`} to={`/u/${person.username}`}>
          <Avatar name={person.name} rank={person.currentOverallRank} self={isSelf} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-400">
            <Link className="font-bold text-white hover:underline" to={`/u/${person.username}`}>
              {isSelf ? "You" : person.name}
            </Link>{" "}
            finished a workout <span className="text-zinc-600">· {timeAgo(item.createdAt)}</span>
          </p>
          <p className="font-display mt-1 break-words text-xl leading-tight text-white">{item.title || "Workout"}</p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {[
              ["Volume", `${formatNumber(item.totalVolume)}kg`],
              ["Sets", item.totalSets || 0],
              ["Exercises", item.exerciseCount || 0]
            ].map(([label, value]) => (
              <div className="flex items-baseline gap-1.5" key={label}>
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-bold tabular-nums text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>
          {item.bestEstimated1RM ? <p className="mt-1 text-xs text-zinc-500">Best estimated 1RM {formatNumber(item.bestEstimated1RM)}kg</p> : null}
        </div>
      </div>
    </article>
  );
};

export default FeedCard;
