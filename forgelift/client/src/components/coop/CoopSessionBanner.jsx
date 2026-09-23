import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { coopSessionService } from "../../services/coopSessionService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const CoopSessionBanner = ({ sessionId }) => {
  const { user } = useAuth();
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;

    const refresh = async () => {
      try {
        const data = await coopSessionService.getSession(sessionId);
        if (active) setSession(data.session);
      } catch (_err) {
        // ignore transient poll failures
      }
    };

    refresh();
    const interval = setInterval(refresh, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  if (!session || session.status !== "active") return null;

  const partner = session.participants?.find((participant) => participant.userId !== user?._id);
  if (!partner) return null;

  return (
    <section className="mb-5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-200">Training together</p>
            <p className="text-white">
              {partner.user?.name || "Your training partner"} is at {formatNumber(partner.totalVolume)}kg ·{" "}
              {partner.completedSets || 0} sets
              {partner.currentExerciseName ? ` · ${partner.currentExerciseName}` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoopSessionBanner;
