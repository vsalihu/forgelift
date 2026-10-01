import "@fontsource-variable/archivo/wdth.css";
import "../landing/landing.css";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { EmblemCore } from "../landing/ForgeEmblem.jsx";
import { EASE } from "../landing/shared.jsx";

// Right-hand panel on desktop: the forge emblem and one line of context.
const AuthVisual = ({ rank, caption }) => (
  <div className="relative hidden p-4 lg:block">
    <div className="relative flex h-full min-h-[40rem] flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-[radial-gradient(80%_60%_at_50%_35%,rgba(249,115,22,0.18),transparent_70%),linear-gradient(180deg,#101217,#08090c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-1 items-center justify-center px-10 pt-10">
        <div className="relative aspect-square w-full max-w-[26rem]">
          <EmblemCore embers={30} rank={rank} />
        </div>
      </div>
      <div className="relative px-10 pb-12 pt-6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            key={caption.title}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <p className="font-display text-3xl leading-tight text-white [text-wrap:balance]">{caption.title}</p>
            <p className="mt-3 max-w-md text-base leading-7 text-zinc-400">{caption.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
);

const AuthShell = ({ title, subtitle, rank, caption, children, footer, headerAction, wide = false }) => {
  const reduce = useReducedMotion();
  return (
    <div className="landing relative min-h-[100dvh] overflow-x-clip text-white">
      <div aria-hidden="true" className="landing-grain" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_65%)]" />

      <div className="relative grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col px-4 py-5 sm:px-10 lg:px-16 lg:py-8">
          <header className="flex items-center justify-between">
            <Link aria-label="ForgeLift home" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" to="/">
              <img alt="ForgeLift" className="h-7 w-auto" height="362" src="/logo-full.png" width="1357" />
            </Link>
            {headerAction || (
              <Link
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Home
              </Link>
            )}
          </header>

          <main className="flex flex-1 items-center py-10 sm:py-14">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={`mx-auto w-full ${wide ? "max-w-xl" : "max-w-md"}`}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <h1 className="font-display text-4xl leading-[1.05] text-white [text-wrap:balance] sm:text-5xl">{title}</h1>
              {subtitle ? <p className="mt-4 text-lg leading-7 text-zinc-400">{subtitle}</p> : null}
              <div className="mt-9">{children}</div>
              {footer ? <div className="mt-8 text-center text-sm text-zinc-400">{footer}</div> : null}
            </motion.div>
          </main>
        </div>

        <AuthVisual caption={caption} rank={rank} />
      </div>
    </div>
  );
};

export default AuthShell;
