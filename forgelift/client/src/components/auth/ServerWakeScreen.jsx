import "@fontsource-variable/archivo/wdth.css";
import "../landing/landing.css";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { EmblemCore } from "../landing/ForgeEmblem.jsx";
import { EASE, RANK_ORDER } from "../landing/shared.jsx";

const WAKE_AFTER_SECONDS = 3;
const SLOW_AFTER_SECONDS = 60;

// Full-screen loading state for requests that may hit a sleeping server.
// After 3 seconds it explains that the server is starting up, with a running timer.
const ServerWakeScreen = ({ title = "Logging you in…" }) => {
  const reduce = useReducedMotion();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, []);

  const waking = seconds >= WAKE_AFTER_SECONDS;
  const slow = seconds >= SLOW_AFTER_SECONDS;
  const rank = RANK_ORDER[reduce ? 5 : Math.floor(seconds / 2) % RANK_ORDER.length];

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-busy="true"
      className="landing fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#07080a]/95 px-6 text-white backdrop-blur-md"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div aria-hidden="true" className="landing-grain" />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative aspect-square w-48 sm:w-56">
          <EmblemCore embers={18} rank={rank} />
        </div>

        <h2 className="font-display mt-8 text-3xl leading-tight text-white sm:text-4xl">{waking ? "Waking up the server" : title}</h2>

        <div aria-live="polite" className="mt-4 min-h-[7.5rem]" role="status">
          <AnimatePresence initial={false} mode="wait">
            {waking ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 10 }}
                key={slow ? "slow" : "waking"}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <p className="text-base leading-7 text-zinc-300">
                  {slow
                    ? "This is taking longer than usual. Hang on a little longer, or check your connection and try again."
                    : "ForgeLift's server sleeps when nobody is using it. The first request can take up to a minute, and you'll go straight in once it's ready."}
                </p>
                <p className="mt-4 text-sm tabular-nums text-zinc-500">{seconds}s</p>
              </motion.div>
            ) : (
              <motion.p animate={{ opacity: 1 }} className="text-base text-zinc-400" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="quick">
                One moment.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ServerWakeScreen;
