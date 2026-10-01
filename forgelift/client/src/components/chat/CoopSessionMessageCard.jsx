import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { coopSessionService } from "../../services/coopSessionService.js";
import { DumbbellIcon } from "../icons/navIcons.jsx";

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

  const btn = "inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-4 text-sm font-bold disabled:opacity-50";

  return (
    <div className="w-full max-w-sm rounded-3xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.1] to-transparent p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
        <DumbbellIcon aria-hidden="true" className="h-4 w-4" />
        Train together
      </div>
      <p className="font-display mt-1.5 text-lg leading-tight text-white">{session.title}</p>

      {session.status === "pending" ? (
        isGuest ? (
          <div className="mt-3 flex gap-2">
            <button className={`${btn} text-zinc-300 hover:bg-white/[0.06]`} disabled={busy} type="button" onClick={() => respond(false)}>
              Decline
            </button>
            <button className={`${btn} bg-sky-400 text-[#04121c]`} disabled={busy} type="button" onClick={() => respond(true)}>
              Join
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">Waiting for them to join.</p>
        )
      ) : null}

      {session.status === "declined" ? <p className="mt-2 text-sm text-zinc-500">Declined.</p> : null}

      {session.status === "active" || session.status === "completed" ? (
        <ul className="mt-3 space-y-1.5">
          {session.participants?.map((participant) => (
            <li className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2 text-sm" key={participant.userId}>
              <span className="truncate font-semibold text-white">{participant.userId === user?._id ? "You" : participant.user?.name || "Friend"}</span>
              <span className="shrink-0 tabular-nums text-zinc-300">
                {formatNumber(participant.totalVolume)}kg · {participant.completedSets || 0} sets
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {session.status === "active" ? (
        <Link className="mt-3 flex min-h-10 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02]" to="/gym-mode">
          Open Gym Mode
        </Link>
      ) : null}
    </div>
  );
};

export default CoopSessionMessageCard;
