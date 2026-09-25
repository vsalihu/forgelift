import { ArrowRight, CalendarDays, Dumbbell, HeartPulse, MessageCircle, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import BrandSignature from "../components/brand/BrandSignature.jsx";
import Footer from "../components/layout/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getRankImage } from "../utils/rankImages.js";

const RANK_ORDER = ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Warrior", "Ultimate"];

const features = [
  {
    icon: Zap,
    title: "Smart Overload & Deload",
    text: "Know exactly when to push harder and when to back off, based on your real training data, not guesswork."
  },
  {
    icon: CalendarDays,
    title: "AI-Generated Training Plans",
    text: "Mark rest and treatment days on your calendar. Once ForgeLift knows your pattern, it builds your next 3-4 weeks for you."
  },
  {
    icon: Shield,
    title: "9-Tier Rank System",
    text: "Copper to Ultimate, an overall rank plus a rank for every muscle group, built from your actual strength and volume."
  },
  {
    icon: HeartPulse,
    title: "Recovery & Muscle Load",
    text: "See exactly how loaded each muscle group is before you decide what's next, so you train hard without digging a hole."
  },
  {
    icon: MessageCircle,
    title: "Train With Friends",
    text: "Chat, send challenges, and train live together, watching each other's sets and volume update in real time."
  },
  {
    icon: Dumbbell,
    title: "Built For The Gym Floor",
    text: "Gym Mode is a live logging flow with rest timers and smart weight suggestions, made for one-handed use mid-set."
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

const staggerParent = { show: { transition: { staggerChildren: 0.08 } } };

const LandingPage = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-forge-ember/20 blur-[120px]" />
          <div className="absolute -right-24 top-32 h-72 w-72 rounded-full bg-forge-copper/20 blur-[100px]" />
        </div>

        <main className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24 lg:px-8">
          <motion.div initial="hidden" animate="show" variants={staggerParent}>
            <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
              <img alt="" aria-hidden="true" className="h-8 w-auto" src="/logo-icon.png" />
              <p className="text-sm font-black uppercase tracking-[0.28em] text-forge-copper">Intelligent training system</p>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Forge your{" "}
              <span className="bg-gradient-to-r from-forge-ember to-amber-300 bg-clip-text text-transparent">
                strongest self.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              ForgeLift learns how you actually train, your split, your recovery, your pace, then builds what
              comes next: your next workout, your next rank, your next three weeks.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forge-ember px-6 text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-600"
                to="/register"
              >
                Start training free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-md border border-white/15 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                to="/login"
              >
                Login
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              <span>9 Rank Tiers</span>
              <span className="text-forge-copper">/</span>
              <span>AI-Generated Plans</span>
              <span className="text-forge-copper">/</span>
              <span>Train With Friends</span>
            </motion.div>

            <BrandSignature variant="hero" />
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              className="absolute -left-6 -top-6 hidden w-40 rounded-xl border border-white/10 bg-forge-panel/95 p-3 shadow-metal backdrop-blur sm:block"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-forge-copper">This week</p>
              <p className="mt-1 text-sm font-bold text-white">Push · Pull · Legs</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-forge-ember" />
              </div>
            </motion.div>

            <div className="metal-panel rounded-2xl border-forge-copper/30 p-6 shadow-metal">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-forge-copper">Overall rank</p>
              <div className="mt-4 flex items-center gap-4">
                <img alt="" aria-hidden="true" className="h-16 w-16" src={getRankImage("Diamond")} />
                <div>
                  <p className="text-2xl font-black text-white">Diamond</p>
                  <p className="text-sm text-slate-400">4,820 XP</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>Progress to Elite</span>
                  <span>68%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-forge-ember to-amber-300"
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -bottom-6 -right-4 hidden items-center gap-2 rounded-xl border border-white/10 bg-forge-panel/95 p-3 shadow-metal backdrop-blur sm:flex"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">Denis challenged you</p>
                <p className="text-[10px] text-slate-400">Most volume · 7 days</p>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-forge-copper">What you get</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Not a spreadsheet. A training partner.</h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              className="metal-panel group rounded-xl p-6 transition hover:-translate-y-1 hover:border-forge-ember/40"
              initial={{ opacity: 0, y: 20 }}
              key={feature.title}
              transition={{ delay: (index % 3) * 0.08 }}
              viewport={{ once: true, margin: "-60px" }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-forge-ember/15 text-forge-ember">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 bg-black/20 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} viewport={{ once: true, margin: "-80px" }} whileInView={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-forge-copper">Progress that feels earned</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Nine ranks. Zero shortcuts.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Every rank is built from real strength, volume, and consistency, for your overall total and every muscle
              group you train.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-end justify-center gap-4 sm:gap-6"
            initial="hidden"
            variants={staggerParent}
            viewport={{ once: true, margin: "-60px" }}
            whileInView="show"
          >
            {RANK_ORDER.map((rank) => (
              <motion.div className="flex flex-col items-center gap-2" key={rank} variants={fadeUp} whileHover={{ y: -6, scale: 1.08 }}>
                <img alt={rank} className="h-14 w-14 sm:h-16 sm:w-16" src={getRankImage(rank)} />
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{rank}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-forge-copper/30 bg-gradient-to-br from-forge-copper/20 via-forge-panel to-black/60 p-10 shadow-metal sm:p-14"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true, margin: "-80px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to forge your plan?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
            Create an account, log a few workouts, and let ForgeLift start learning how you train.
          </p>
          <Link
            className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forge-ember px-7 text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-600"
            to="/register"
          >
            Create your free account
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
