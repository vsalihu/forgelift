import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { EASE, RANK_ORDER, Reveal, rankSrc } from "./shared.jsx";

// The climb steepens toward the top: higher ranks take more to earn.
const VIEW_W = 1000;
const VIEW_H = 420;
const PAD_X = 70;
const curvePoint = (t) => ({
  x: PAD_X + t * (VIEW_W - PAD_X * 2),
  y: 350 - 280 * Math.pow(t, 1.6)
});

const PATH = Array.from({ length: 61 }, (_, index) => {
  const { x, y } = curvePoint(index / 60);
  return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

const LadderBadge = ({ rank, index, progress }) => {
  const threshold = index / (RANK_ORDER.length - 1);
  const start = Math.max(0, threshold - 0.08);
  const lit = useTransform(progress, [start, threshold], [0, 1]);
  const opacity = useTransform(lit, [0, 1], [0.28, 1]);
  const scale = useTransform(lit, [0, 1], [0.86, 1]);
  const grayscale = useTransform(lit, [0, 1], ["grayscale(1) brightness(0.6)", "grayscale(0) brightness(1)"]);
  const glow = useTransform(lit, [0, 1], [0, 1]);
  const { x, y } = curvePoint(threshold);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` }}>
      <motion.div className="relative flex flex-col items-center" style={{ opacity, scale }}>
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 h-24 w-24 -translate-y-[60%] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.55),transparent_65%)] blur-md"
          style={{ opacity: glow }}
        />
        <motion.img
          alt={`${rank} rank`}
          className="relative h-16 w-16 object-contain xl:h-[4.5rem] xl:w-[4.5rem]"
          height="320"
          loading="lazy"
          src={rankSrc(rank)}
          style={{ filter: grayscale }}
          width="320"
        />
        <span className="relative mt-2 text-xs font-bold text-zinc-300">{rank}</span>
      </motion.div>
    </div>
  );
};

const RankLadder = () => {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 0.85", "end 0.35"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const settled = useTransform(progress, (value) => (reduce ? 1 : value));

  return (
    <section className="relative scroll-mt-24 py-24 sm:py-32" id="ranks">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="font-display [text-wrap:balance] text-4xl leading-[1.05] text-white sm:text-5xl">Nine ranks. Zero shortcuts.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            Every rank is earned from real strength, volume and consistency, overall and for every muscle you train.
          </p>
        </Reveal>

        <div className="relative mt-16 hidden aspect-[1000/420] md:block" ref={trackRef}>
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            <defs>
              <linearGradient id="ladder-molten" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#b87333" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>
            <path d={PATH} fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 8" strokeLinecap="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <motion.path
              d={PATH}
              fill="none"
              stroke="url(#ladder-molten)"
              strokeLinecap="round"
              strokeWidth="3"
              style={{ pathLength: settled, filter: "drop-shadow(0 0 8px rgba(249,115,22,0.8))" }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {RANK_ORDER.map((rank, index) => (
            <LadderBadge index={index} key={rank} progress={settled} rank={rank} />
          ))}
        </div>

        <motion.ol
          className="mt-12 grid grid-cols-3 gap-x-4 gap-y-8 md:hidden"
          initial={reduce ? false : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView="show"
        >
          {RANK_ORDER.map((rank) => (
            <motion.li
              className="flex flex-col items-center"
              key={rank}
              transition={{ duration: 0.7, ease: EASE }}
              variants={{ hidden: { opacity: 0, y: 18, filter: "grayscale(1)" }, show: { opacity: 1, y: 0, filter: "grayscale(0)" } }}
            >
              <img alt="" className="h-16 w-16 object-contain drop-shadow-[0_8px_24px_rgba(249,115,22,0.35)]" height="320" loading="lazy" src={rankSrc(rank)} width="320" />
              <span className="mt-2 text-xs font-bold text-zinc-300">{rank}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
};

export default RankLadder;
