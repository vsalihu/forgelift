import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import Button from "../Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { challengeService } from "../../services/challengeService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const metricLabel = (metric) => (metric === "workout_count" ? "most workouts" : "most volume");

const daysLeft = (endDate) => {
  if (!endDate) return 0;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
};

const ChallengeMessageCard = ({ challenge: initialChallenge, onChanged }) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(initialChallenge);
  const [busy, setBusy] = useState(false);

  const isOpponent = challenge?.opponentId?._id === user?._id || challenge?.opponentId === user?._id;

  const refresh = async () => {
    try {
      const data = await challengeService.getChallenge(initialChallenge._id);
      setChallenge(data.challenge);
    } catch (_err) {
      // keep last known state
    }
  };

  useEffect(() => {
    refresh();
    if (initialChallenge?.status !== "active" && initialChallenge?.status !== "pending") return undefined;
    const interval = setInterval(refresh, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChallenge?._id]);

  if (!challenge) return null;

  const respond = async (accept) => {
    setBusy(true);
    try {
      const data = await challengeService.respond(challenge._id, accept);
      setChallenge((current) => ({ ...current, ...data.challenge }));
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const creatorName = challenge.creatorId?.name || "They";
  const opponentName = challenge.opponentId?.name || "They";
  const total = (challenge.creatorProgress || 0) + (challenge.opponentProgress || 0);
  const creatorPercent = total ? Math.round(((challenge.creatorProgress || 0) / total) * 100) : 50;

  return (
    <div className="w-full max-w-sm rounded-xl border border-forge-copper/30 bg-forge-copper/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-forge-copper">
        <Trophy className="h-4 w-4" />
        Challenge
      </div>
      <p className="text-sm text-slate-200">
        {metricLabel(challenge.metric)} over {challenge.durationDays} days
      </p>

      {challenge.status === "pending" ? (
        isOpponent ? (
          <div className="mt-3 flex gap-2">
            <Button loading={busy} type="button" onClick={() => respond(true)}>Accept</Button>
            <Button disabled={busy} type="button" variant="ghost" onClick={() => respond(false)}>Decline</Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Waiting for them to accept.</p>
        )
      ) : null}

      {challenge.status === "declined" ? <p className="mt-3 text-sm text-slate-400">Declined.</p> : null}
      {challenge.status === "cancelled" ? <p className="mt-3 text-sm text-slate-400">Cancelled.</p> : null}

      {challenge.status === "active" || challenge.status === "completed" ? (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-300">
            <span>{creatorName}: {formatNumber(challenge.creatorProgress)}</span>
            <span>{opponentName}: {formatNumber(challenge.opponentProgress)}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-forge-ember" style={{ width: `${creatorPercent}%` }} />
            <div className="h-full bg-cyan-400" style={{ width: `${100 - creatorPercent}%` }} />
          </div>
          {challenge.status === "active" ? (
            <p className="mt-2 text-xs text-slate-400">{daysLeft(challenge.endDate)} days left</p>
          ) : (
            <p className="mt-2 text-xs font-bold text-orange-200">
              {challenge.isTie ? "Ended in a tie" : `${challenge.winnerId?.name || "Winner"} won`}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ChallengeMessageCard;
