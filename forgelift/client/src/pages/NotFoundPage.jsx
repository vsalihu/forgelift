import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardIcon } from "../components/icons/navIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];

const NotFoundPage = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-clip bg-[#07080a] px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_65%)] blur-2xl"
      />
      <header className="relative py-5">
        <Link className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" to="/">
          <img alt="ForgeLift" className="h-7 w-auto" height="362" src="/logo-full.png" width="1357" />
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center pb-20 text-center">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          aria-hidden="true"
          className="font-display bg-gradient-to-b from-orange-300 to-forge-ember/40 bg-clip-text text-[7rem] leading-none text-transparent sm:text-[9rem]"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          404
        </motion.p>
        <h1 className="font-display mt-2 text-3xl text-white sm:text-4xl">This page skipped leg day.</h1>
        <p className="mt-3 max-w-md text-zinc-400">There's nothing at this address. It may have moved, or the link has a typo.</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            to="/dashboard"
          >
            <DashboardIcon aria-hidden="true" className="h-4 w-4" />
            Go to dashboard
          </Link>
          {canGoBack ? (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-6 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Go back
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
