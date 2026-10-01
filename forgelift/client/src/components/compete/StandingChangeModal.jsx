import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { acknowledgeStanding, useCompetitionStanding } from "../../hooks/useCompetitionStanding.js";
import Button from "../Button.jsx";
import { describeBoard } from "./boards.js";

const StandingChangeModal = () => {
  const standing = useCompetitionStanding();
  const navigate = useNavigate();
  const place = standing?.enabled ? standing.place : null;
  const previousPlace = standing?.previousPlace ?? null;
  const changed = Boolean(place && previousPlace && place !== previousPlace);

  // First time on a board (or a new week/month): remember the place without a popup.
  useEffect(() => {
    if (standing?.enabled && place && !previousPlace) acknowledgeStanding();
  }, [standing?.enabled, place, previousPlace]);

  const movedUp = changed && place < previousPlace;
  const places = changed ? Math.abs(previousPlace - place) : 0;

  const close = (goToBoard) => {
    acknowledgeStanding();
    if (goToBoard) navigate("/compete");
  };

  return (
    <AnimatePresence>
      {changed ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ scale: 1, y: 0 }}
            aria-labelledby="standing-change-title"
            aria-modal="true"
            className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl ${
              movedUp ? "border-emerald-400/40 bg-gradient-to-b from-emerald-500/15 to-forge-panel" : "border-orange-400/40 bg-gradient-to-b from-orange-500/15 to-forge-panel"
            } bg-forge-panel`}
            initial={{ scale: 0.85, y: 20 }}
            role="dialog"
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.span
              animate={{ y: movedUp ? [8, -6, 0] : [-8, 6, 0] }}
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                movedUp ? "bg-emerald-400/20 text-emerald-300" : "bg-orange-400/20 text-orange-300"
              }`}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {movedUp ? <ArrowUp className="h-7 w-7" /> : <ArrowDown className="h-7 w-7" />}
            </motion.span>
            <h2 className="mt-4 text-xl font-black text-white" id="standing-change-title">
              {movedUp ? `You moved up ${places} place${places === 1 ? "" : "s"}!` : `You dropped ${places} place${places === 1 ? "" : "s"}`}
            </h2>
            <p className="mt-3 text-5xl font-black text-white">#{place}</p>
            <p className="mt-1 text-sm text-slate-400">was #{previousPlace}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{describeBoard(standing.board)}</p>
            {!movedUp ? <p className="mt-2 text-sm text-slate-400">Log a session to climb back up.</p> : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Button className="flex-1" type="button" onClick={() => close(true)}>
                See leaderboard
              </Button>
              <Button className="flex-1" type="button" variant="secondary" onClick={() => close(false)}>
                {movedUp ? "Nice" : "Got it"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default StandingChangeModal;
