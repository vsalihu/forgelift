import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { PrimaryCta } from "./shared.jsx";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#ranks", label: "Ranks" },
  { href: "#compete", label: "Compete" }
];

// Floating pill nav. Transparent over the hero, frosted once the page scrolls.
const LandingNav = () => {
  const { scrollY } = useScroll();
  const background = useTransform(scrollY, [0, 120], ["rgba(14, 16, 20, 0)", "rgba(14, 16, 20, 0.72)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.09)"]);
  const shadow = useTransform(scrollY, [0, 120], ["0 0 0 rgba(0,0,0,0)", "0 18px 50px -20px rgba(0,0,0,0.8)"]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4 sm:top-4">
      <motion.nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-full border pl-5 pr-2 backdrop-blur-xl"
        style={{ backgroundColor: background, borderColor: border, boxShadow: shadow }}
      >
        <Link aria-label="ForgeLift home" className="flex shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" to="/">
          <img alt="ForgeLift" className="h-6 w-auto sm:h-7" height="362" src="/logo-full.png" width="1357" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Link
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            to="/login"
          >
            Log in
          </Link>
          <PrimaryCta className="hidden sm:inline-flex" size="sm" />
        </div>
      </motion.nav>
    </header>
  );
};

export default LandingNav;
