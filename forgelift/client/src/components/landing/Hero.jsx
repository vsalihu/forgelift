import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE, PrimaryCta, RANK_ORDER, SecondaryCta, rankSrc } from "./shared.jsx";

// Deterministic pseudo-random numbers so the ember layout is stable between renders.
const seeded = (seed) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const EmberField = ({ count = 40 }) => {
  const embers = useMemo(() => {
    const random = seeded(42);
    return Array.from({ length: count }, (_, index) => {
      const size = 2.5 + random() * 4.5;
      return {
        id: index,
        style: {
          left: `${12 + random() * 76}%`,
          bottom: `${8 + random() * 22}%`,
          width: `${size}px`,
          height: `${size}px`,
          "--dur": `${6 + random() * 7}s`,
          "--delay": `${-random() * 12}s`,
          "--drift": `${(random() - 0.5) * 120}px`,
          "--rise": `${260 + random() * 340}px`,
          "--peak": `${0.65 + random() * 0.35}`
        }
      };
    });
  }, [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {embers.map((ember) => (
        <span className="ember" key={ember.id} style={ember.style} />
      ))}
    </div>
  );
};

const HEADLINE = [
  { text: "Forge", ember: false },
  { text: "your", ember: false },
  { text: "strongest", ember: true },
  { text: "self.", ember: true }
];

const Hero = () => {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const [rankIndex, setRankIndex] = useState(5);

  useEffect(() => {
    if (reduce) return undefined;
    const timer = window.setInterval(() => setRankIndex((index) => (index + 1) % RANK_ORDER.length), 2600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const emblemY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const emblemScale = useTransform(scrollYProgress, [0, 1], [1, 0.84]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 18 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 18 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [11, -11]);
  const badgeX = useTransform(smoothX, [-0.5, 0.5], [-22, 22]);
  const badgeY = useTransform(smoothY, [-0.5, 0.5], [-16, 16]);
  const glowX = useTransform(smoothX, [-0.5, 0.5], [40, -40]);
  const glowY = useTransform(smoothY, [-0.5, 0.5], [30, -30]);

  const handlePointerMove = (event) => {
    if (reduce || event.pointerType !== "mouse" || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const rank = RANK_ORDER[rankIndex];

  return (
    <section
      className="relative isolate flex min-h-[100dvh] items-center overflow-hidden pb-20 pt-28 lg:pt-24"
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      onPointerMove={handlePointerMove}
      ref={sectionRef}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(184,115,51,0.22),transparent_65%)]" />
        <div className="absolute right-[-10%] top-[8%] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(249,115,22,0.12),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#07080a]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:px-8">
        <motion.div style={reduce ? undefined : { y: textY, opacity: textOpacity }}>
          <h1 className="font-display [text-wrap:balance] text-[2.55rem] leading-[1.04] text-white sm:text-6xl lg:text-[4.25rem]">
            {HEADLINE.map((word, index) => (
              <span className="-mx-[0.3em] -my-[0.3em] inline-block overflow-hidden px-[0.3em] pb-[0.42em] pt-[0.3em] align-top" key={word.text}>
                <motion.span
                  animate={{ y: "0%" }}
                  className={`inline-block ${word.ember ? "ember-text" : ""}`}
                  initial={reduce ? false : { y: "110%" }}
                  transition={{ duration: 1, delay: 0.15 + index * 0.09, ease: EASE }}
                >
                  {word.text}
                </motion.span>
                {index < HEADLINE.length - 1 ? " " : null}
              </span>
            ))}
          </h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-[34rem] text-lg leading-8 text-zinc-300 sm:text-xl sm:leading-9"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
          >
            ForgeLift reads every set you log, then tells you what to lift next and when to back off.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-wrap items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          >
            <PrimaryCta />
            <SecondaryCta />
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto aspect-square w-full max-w-[min(30rem,82vw)]"
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          style={reduce ? undefined : { y: emblemY, scale: emblemScale }}
          transition={{ duration: 1.4, delay: 0.25, ease: EASE }}
        >
          <div className="h-full w-full [perspective:1200px]">
            <motion.div className="relative h-full w-full" style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}>
              <motion.div
                aria-hidden="true"
                className="landing-glow-pulse absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.6),rgba(249,115,22,0.14)_45%,transparent_70%)] blur-2xl"
                style={reduce ? undefined : { x: glowX, y: glowY }}
              />
              <div aria-hidden="true" className="absolute inset-[4%] rounded-full border border-white/[0.05]" />
              <div
                aria-hidden="true"
                className="absolute inset-[15%] rounded-full border border-white/[0.08] bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.07),rgba(10,11,14,0.6)_62%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_120px_-30px_rgba(249,115,22,0.45)]"
              />
              <div aria-hidden="true" className="forge-arc absolute inset-[4%]" />
              <div aria-hidden="true" className="forge-arc forge-arc--slow absolute inset-[15%]" />

              <motion.div className="absolute inset-[25%]" style={reduce ? undefined : { x: badgeX, y: badgeY }}>
                <AnimatePresence initial={false}>
                  <motion.img
                    alt={`${rank} rank badge`}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(249,115,22,0.35)]"
                    exit={{ opacity: 0, scale: 1.12, filter: "blur(10px)" }}
                    height="320"
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    key={rank}
                    src={rankSrc(rank)}
                    transition={{ duration: 0.8, ease: EASE }}
                    width="320"
                  />
                </AnimatePresence>
              </motion.div>

              <EmberField />
            </motion.div>
          </div>

          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-baseline gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#0e1014]/80 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-bold text-white"
                exit={{ opacity: 0, y: -6 }}
                initial={{ opacity: 0, y: 6 }}
                key={rank}
                transition={{ duration: 0.3 }}
              >
                {rank}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs tabular-nums text-zinc-400">
              Rank {rankIndex + 1} of {RANK_ORDER.length}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
