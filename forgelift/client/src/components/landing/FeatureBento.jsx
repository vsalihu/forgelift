import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ChallengeIcon } from "../icons/featureIcons.jsx";
import { DeloadIcon, OverloadIcon } from "../icons/navIcons.jsx";
import { EASE, ExampleNote, Reveal } from "./shared.jsx";

// Card whose glow and border light up under the cursor. The position is written to CSS variables, not React state.
const SpotlightCard = ({ className = "", children, delay = 0 }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const handleMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.article
      className={`spotlight overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0f13] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8 ${className}`}
      initial={reduce ? false : { opacity: 0, y: 30 }}
      onPointerMove={handleMove}
      ref={ref}
      transition={{ duration: 0.9, delay, ease: EASE }}
      viewport={{ once: true, amount: 0.25 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.article>
  );
};

const CardText = ({ title, children }) => (
  <div className="relative">
    <h3 className="text-xl font-bold text-white sm:text-2xl">{title}</h3>
    <p className="mt-3 max-w-md text-base leading-7 text-zinc-400">{children}</p>
  </div>
);

const OverloadVisual = () => (
  <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
    <div className="flex items-center gap-4 rounded-2xl border border-forge-ember/30 bg-forge-ember/10 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forge-ember/20 text-orange-200">
        <OverloadIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-white">Bench Press</p>
        <p className="text-sm text-orange-200">Add 2.5 kg next session</p>
      </div>
    </div>
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-200">
        <DeloadIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-white">Deadlift</p>
        <p className="text-sm text-zinc-400">Hold the weight, deload due</p>
      </div>
    </div>
  </div>
);

const LoadGauge = () => {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto mt-6 w-full max-w-[15rem]">
      <svg aria-hidden="true" className="w-full" viewBox="0 0 200 116">
        <defs>
          <linearGradient id="gauge-heat" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="45%" stopColor="#fb923c" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-heat)" strokeLinecap="round" strokeWidth="12" />
        <motion.g
          initial={reduce ? false : { rotate: -80 }}
          style={{ originX: "100px", originY: "100px" }}
          transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.3 }}
          viewport={{ once: true, amount: 0.6 }}
          whileInView={{ rotate: 18 }}
        >
          <line stroke="#fde68a" strokeLinecap="round" strokeWidth="4" x1="100" x2="100" y1="100" y2="34" />
        </motion.g>
        <circle cx="100" cy="100" fill="#fde68a" r="7" />
      </svg>
      <p className="-mt-1 text-center text-sm font-bold text-orange-200">In the sweet spot</p>
    </div>
  );
};

const ChatVisual = () => (
  <div className="relative mt-6 space-y-2">
    <div className="mr-8 rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3 text-sm text-zinc-200">Leg day at 6?</div>
    <div className="ml-8 flex items-center gap-3 rounded-2xl rounded-br-md border border-forge-ember/40 bg-forge-ember/10 px-4 py-3">
      <ChallengeIcon className="h-5 w-5 shrink-0 text-orange-300" />
      <p className="text-sm text-orange-100">Challenge sent: most volume in 7 days</p>
    </div>
  </div>
);

const FeatureBento = () => (
  <section className="relative py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="max-w-2xl">
        <h2 className="font-display [text-wrap:balance] text-4xl leading-[1.05] text-white sm:text-5xl">Smarter than a training log.</h2>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[minmax(17rem,auto)]">
        <SpotlightCard className="bg-[radial-gradient(120%_120%_at_0%_0%,rgba(249,115,22,0.16),transparent_55%)] md:col-span-2 lg:col-span-4">
          <CardText title="Smart overload and deload">
            Know when to add weight and when to back off, worked out from your own numbers.
          </CardText>
          <OverloadVisual />
        </SpotlightCard>

        <SpotlightCard className="flex flex-col md:row-span-2 lg:col-span-2 lg:row-span-2" delay={0.08}>
          <CardText title="Your path to the next rank">
            See which muscles are holding your rank back, and why, in plain words.
          </CardText>
          <div className="relative flex flex-1 items-center justify-center py-8">
            <div aria-hidden="true" className="landing-glow-pulse absolute bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35),transparent_65%)] blur-xl" />
            <img alt="Rear delts highlighted on a muscle map" className="relative h-44 w-44 object-contain" height="160" loading="lazy" src="/muscles/rear-delts.png" width="160" />
          </div>
          <p className="relative mt-4 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
            Rear delts: 2 sets a week. Aim for 8 to keep climbing.
          </p>
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-2" delay={0.12}>
          <CardText title="Fatigue that knows your PRs">10 kg and 50 kg don't tire you the same, so load is measured against your own maxes.</CardText>
          <LoadGauge />
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-2" delay={0.16}>
          <CardText title="Train with friends">Chat, send challenges and train live together.</CardText>
          <ChatVisual />
        </SpotlightCard>
      </div>
      <ExampleNote className="mt-5" />
    </div>
  </section>
);

export default FeatureBento;
