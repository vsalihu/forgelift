import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { coopSessionService } from "../../services/coopSessionService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const CoopSessionMessageCard = ({ session: initialSession, onChanged }) => {
  const { user } = useAuth();
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState(false);

  const isGuest = initialSession?.guestId?._id === user?._id || initialSession?.guestId === user?._id;

  const refresh = async () => {
    try {
      const data = await coopSessionService.getSession(initialSession._id);
      setSession(data.session);
    } catch (_err) {
      // keep last known state
    }
  };

  useEffect(() => {
    refresh();
    if (initialSession?.status !== "active") return undefined;
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession?._id]);

  if (!session) return null;

  const respond = async (accept) => {
    setBusy(true);
    try {
      const data = await coopSessionService.respond(session._id, accept);
      setSession((current) => ({ ...current, ...data.session }));
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-cyan-200">
        <Dumbbell className="h-4 w-4" />
        Workout together
      </div>
      <p className="text-sm text-slate-200">{session.title}</p>

      {session.status === "pending" ? (
        isGuest ? (
          <div className="mt-3 flex gap-2">
            <Button loading={busy} type="button" onClick={() => respond(true)}>Join</Button>
            <Button disabled={busy} type="button" variant="ghost" onClick={() => respond(false)}>Decline</Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Waiting for them to join.</p>
        )
      ) : null}

      {session.status === "declined" ? <p className="mt-3 text-sm text-slate-400">Declined.</p> : null}

      {session.status === "active" ? (
        <div className="mt-3 space-y-2">
          {session.participants?.map((participant) => (
            <div className="flex items-center justify-between rounded-md bg-black/25 p-2 text-sm" key={participant.userId}>
              <span className="font-semibold text-white">{participant.user?.name || "Training"}</span>
              <span className="text-slate-300">{formatNumber(participant.totalVolume)}kg · {participant.completedSets || 0} sets</span>
            </div>
          ))}
          <Link className="mt-2 inline-flex min-h-10 items-center rounded-md bg-forge-ember px-3 text-sm font-semibold text-white" to="/gym-mode">
            Go to Gym Mode
          </Link>
        </div>
      ) : null}

      {session.status === "completed" ? (
        <div className="mt-3 space-y-1">
          {session.participants?.map((participant) => (
            <p className="text-sm text-slate-300" key={participant.userId}>
              {participant.user?.name || "Friend"}: {formatNumber(participant.totalVolume)}kg
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CoopSessionMessageCard;
