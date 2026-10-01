import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CityIcon, FirstPlaceIcon, TrendingUpIcon } from "../icons/featureIcons.jsx";
import { EASE, ExampleNote, Reveal, rankSrc } from "./shared.jsx";

const PODIUM = [
  { place: 2, name: "Dren B.", rank: "Platinum", score: "44,500 kg", height: "h-32 sm:h-40" },
  { place: 1, name: "Arben K.", rank: "Diamond", score: "48,000 kg", height: "h-44 sm:h-56" },
  { place: 3, name: "Leotrim G.", rank: "Gold", score: "41,000 kg", height: "h-24 sm:h-28" }
];

const BOARDS = ["Volume", "PRs", "Progress", "Weight loss", "Weight gain"];

const CompeteSection = () => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const podiumY = useTransform(scrollYProgress, [0, 1], [60, -40]);
  const cardY = useTransform(scrollYProgress, [0, 1], [70, -50]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.1, 0.8]);

  return (
    <section className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32" id="compete" ref={ref}>
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">Compete</p>
          <h2 className="font-display [text-wrap:balance] mt-4 text-4xl leading-[1.05] text-white sm:text-5xl">Your city has a leaderboard.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">
            Pick a city and compete with lifters near you, split by gender and age. You don't need to be friends to challenge them.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {BOARDS.map((board) => (
              <li className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200" key={board}>
                {board}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="relative">
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-[10%] bottom-0 top-[10%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.3),transparent_62%)] blur-2xl"
            style={reduce ? undefined : { scale: glowScale }}
          />

          <motion.div className="mx-auto max-w-xl" style={reduce ? undefined : { y: podiumY }}>
            <div className="flex items-end justify-center gap-3 sm:gap-4">
              {PODIUM.map((spot, index) => (
                <div className="flex w-1/3 max-w-[10rem] flex-col items-center" key={spot.place}>
                  {spot.place === 1 ? (
                    <motion.span
                      animate={reduce ? undefined : { y: [0, -6, 0] }}
                      className="mb-1 text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.8)]"
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <FirstPlaceIcon className="h-8 w-8" />
                    </motion.span>
                  ) : null}
                  <motion.img
                    alt={`${spot.rank} rank badge`}
                    className="h-16 w-16 object-contain drop-shadow-[0_10px_24px_rgba(249,115,22,0.45)] sm:h-20 sm:w-20"
                    height="320"
                    initial={reduce ? false : { opacity: 0, y: 20, scale: 0.8 }}
                    loading="lazy"
                    src={rankSrc(spot.rank)}
                    transition={{ duration: 0.7, delay: 0.5 + index * 0.12, ease: EASE }}
                    viewport={{ once: true, amount: 0.5 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    width="320"
                  />
                  <p className="mt-2 truncate text-sm font-bold text-white">{spot.name}</p>
                  <p className="text-xs tabular-nums text-zinc-400">{spot.score}</p>
                  <motion.div
                    className={`mt-3 flex w-full origin-bottom items-start justify-center rounded-t-3xl border border-b-0 pt-4 ${spot.height} ${
                      spot.place === 1
                        ? "border-forge-ember/50 bg-gradient-to-b from-forge-ember/35 to-forge-ember/5 shadow-[0_0_60px_-10px_rgba(249,115,22,0.7)]"
                        : "border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.01]"
                    }`}
                    initial={reduce ? false : { scaleY: 0 }}
                    transition={{ duration: 1, delay: index * 0.1, ease: EASE }}
                    viewport={{ once: true, amount: 0.4 }}
                    whileInView={{ scaleY: 1 }}
                  >
                    <span className={`font-display text-3xl ${spot.place === 1 ? "text-white" : "text-zinc-400"}`}>{spot.place}</span>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto -mt-6 w-fit rounded-3xl border border-white/10 bg-[#101318]/90 p-4 pr-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md sm:absolute sm:-bottom-10 sm:right-0 sm:mt-0"
            style={reduce ? undefined : { y: cardY }}
          >
            <div className="flex items-center gap-4">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-forge-ember text-lg font-black text-[#160a02] shadow-[0_0_24px_rgba(249,115,22,0.7)]">
                5
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                  Up 3 places
                  <TrendingUpIcon className="h-4 w-4 text-orange-300" />
                </p>
                <p className="flex items-center gap-1 text-xs text-zinc-400">
                  <CityIcon className="h-3.5 w-3.5" />
                  Pristina, Men 25-34
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ExampleNote className="mt-10 lg:text-right" />
      </div>
    </section>
  );
};

export default CompeteSection;
