import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { PrimaryCta, Reveal, SecondaryCta } from "./shared.jsx";

export const FinalCta = () => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const markRotate = useTransform(scrollYProgress, [0, 1], [-14, 10]);
  const markY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  const handleMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div
        className="spotlight relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-forge-ember/25 bg-[radial-gradient(90%_120%_at_85%_10%,rgba(249,115,22,0.28),transparent_55%),linear-gradient(180deg,#121419,#0a0b0e)] px-6 py-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_60px_140px_-50px_rgba(249,115,22,0.55)] sm:px-14 sm:py-24"
        onPointerMove={handleMove}
        ref={ref}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 md:block">
          <motion.img
            alt=""
            className="h-[24rem] w-[24rem] opacity-[0.14] drop-shadow-[0_0_60px_rgba(249,115,22,0.5)]"
            height="417"
            loading="lazy"
            src="/logo-icon.png"
            style={reduce ? undefined : { rotate: markRotate, y: markY }}
            width="417"
          />
        </div>
        <Reveal className="relative max-w-2xl">
          <h2 className="font-display [text-wrap:balance] text-4xl leading-[1.05] text-white sm:text-6xl">
            Your next rank is <span className="ember-text">waiting.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-300">
            Free to start. Log a few workouts and ForgeLift starts learning how you train.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <PrimaryCta />
            <SecondaryCta />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const footerLinks = [
  { href: "#how", label: "How it works" },
  { href: "#ranks", label: "Ranks" },
  { href: "#compete", label: "Compete" }
];

export const LandingFooter = () => (
  <footer className="border-t border-white/[0.06] px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <img alt="ForgeLift" className="h-7 w-auto" height="362" loading="lazy" src="/logo-full.png" width="1357" />
        <p className="mt-3 text-sm text-zinc-500">Forged by SALIHU</p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-zinc-400">
        {footerLinks.map((link) => (
          <a className="transition-colors hover:text-white" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
        <Link className="transition-colors hover:text-white" to="/login">
          Log in
        </Link>
      </nav>
    </div>
    <p className="mx-auto mt-10 max-w-7xl text-xs text-zinc-600">© 2026 ForgeLift</p>
  </footer>
);
