import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import CompetitionForm from "../components/compete/CompetitionForm.jsx";
import LeaderboardView, { viewerDivisionLabel } from "../components/compete/LeaderboardView.jsx";
import { AGE_OPTIONS, BOARD_TYPES, GENDER_OPTIONS, PERIOD_OPTIONS, SCOPE_OPTIONS } from "../components/compete/boards.js";
import BottomSheet from "../components/ui/BottomSheet.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { clearStanding, refreshStanding } from "../hooks/useCompetitionStanding.js";
import { competitionService } from "../services/competitionService.js";
import { safetyService } from "../services/safetyService.js";
import { BarChartIcon, ChallengeIcon, CityIcon, PinnedIcon, WorldIcon } from "../components/icons/featureIcons.jsx";
import { CompeteIcon, FriendsIcon } from "../components/icons/navIcons.jsx";

const PillSelect = ({ label, value, options, onChange }) => (
  <label className="relative flex min-w-0 flex-1 sm:inline-flex sm:flex-none">
    <span className="sr-only">{label}</span>
    <select
      className="min-h-11 w-full appearance-none rounded-full border border-white/10 bg-white/[0.03] py-2 pl-4 pr-9 text-sm font-bold text-zinc-200 outline-none [color-scheme:dark] hover:border-white/25 focus:border-forge-ember/60"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
  </label>
);

const JoinHero = ({ submitting, error, onJoin }) => {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-clip rounded-[2rem] border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.16] via-white/[0.02] to-transparent p-6 sm:p-7"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-forge-ember/20 blur-3xl" />
        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-forge-ember/40 bg-forge-ember/15 text-orange-200">
            <CompeteIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display mt-5 text-3xl leading-tight text-white sm:text-4xl">Compete with lifters near you.</h2>
          <p className="mt-3 text-base leading-7 text-zinc-300">Climb boards in your city, your country and the world, against people in your own division.</p>
          <ul className="mt-6 space-y-3 text-sm text-zinc-200">
            {[
              [WorldIcon, "City, country and world leaderboards"],
              [FriendsIcon, "Divisions by gender and age, plus Open for everyone"],
              [BarChartIcon, "Boards for volume, PRs, progress and bodyweight change"],
              [ChallengeIcon, "Challenge anyone who competes, friend or not"]
            ].map(([Icon, text]) => (
              <li className="flex items-center gap-3" key={text}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/30">
                  <Icon className="h-4 w-4 text-orange-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-5 text-zinc-500">
            Lifts that look implausible (a jump of more than 20% at once, or far beyond world-class) stay in your log but don&apos;t count on public boards.
          </p>
        </div>
      </motion.section>
      <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7">
        <h2 className="font-display mb-5 text-2xl text-white">Join</h2>
        <CompetitionForm error={error} submitLabel="Join competitions" submitting={submitting} onSubmit={onJoin} />
      </section>
    </div>
  );
};

const CompetePage = () => {
  const { user } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const [competition, setCompetition] = useState(null);
  const [filters, setFilters] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const applyCompetition = useCallback((next) => {
    setCompetition(next);
    if (next?.enabled) {
      setFilters((current) => current || { ...next.featured, gender: next.genderDivision || "open", age: next.ageGroup || "all" });
    }
  }, []);

  useEffect(() => {
    competitionService
      .getMine()
      .then((data) => applyCompetition(data.competition))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applyCompetition]);

  useEffect(() => {
    if (!competition?.enabled || !filters) return undefined;
    let cancelled = false;
    setBoardLoading(true);
    competitionService
      .getLeaderboard(filters)
      .then((data) => !cancelled && setLeaderboard(data.leaderboard))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setBoardLoading(false));
    return () => {
      cancelled = true;
    };
  }, [competition?.enabled, competition?.cityId, competition?.weightGoal, filters]);

  useEffect(() => {
    if (showSettings) safetyService.getBlocked().then((data) => setBlockedUsers(data.users || [])).catch(() => {});
  }, [showSettings]);

  const saveCompetition = async (payload) => {
    setSaving(true);
    setFormError("");
    try {
      const data = await competitionService.join(payload);
      applyCompetition(data.competition);
      setShowSettings(false);
      refreshStanding({ force: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pinBoard = async () => {
    const { type, scope, period } = filters;
    try {
      const data = await competitionService.pinBoard({ type, scope, period });
      setCompetition(data.competition);
      refreshStanding({ force: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const leave = async () => {
    await competitionService.leave();
    clearStanding();
    setConfirmLeave(false);
    setShowSettings(false);
    setFilters(null);
    setLeaderboard(null);
    setCompetition({ enabled: false });
  };

  const unblock = async (username) => {
    await safetyService.unblock(username);
    setBlockedUsers((users) => users.filter((blocked) => blocked.username !== username));
  };

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const isPinned =
    competition?.featured && filters && competition.featured.type === filters.type && competition.featured.scope === filters.scope && competition.featured.period === filters.period;
  const activeType = BOARD_TYPES.find((type) => type.value === filters?.type);

  return (
    <Layout>
      {confirmLeave ? (
        <ConfirmModal
          confirmLabel="Leave"
          description="You'll disappear from every leaderboard. Your workouts aren't affected, and you can rejoin any time."
          title="Leave competitions?"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={leave}
        />
      ) : null}

      <BottomSheet open={showSettings && Boolean(competition?.enabled)} title="Competition settings" onClose={() => setShowSettings(false)}>
        <div className="space-y-8">
          <CompetitionForm error={formError} initial={competition} submitLabel="Save" submitting={saving} onSubmit={saveCompetition} />
          <section>
            <h3 className="text-sm font-bold text-white">Blocked</h3>
            {blockedUsers.length ? (
              <ul className="mt-3 space-y-2">
                {blockedUsers.map((blocked) => (
                  <li className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3 text-sm" key={blocked._id}>
                    <span className="min-w-0 truncate text-zinc-200">
                      {blocked.name} <span className="text-zinc-500">@{blocked.username}</span>
                    </span>
                    <button className="shrink-0 font-bold text-orange-300 hover:text-orange-200" type="button" onClick={() => unblock(blocked.username)}>
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">Nobody. You can block someone from their profile.</p>
            )}
          </section>
          <button
            className="min-h-11 rounded-full border border-red-400/30 bg-red-500/10 px-5 text-sm font-bold text-red-100 hover:bg-red-500/20"
            type="button"
            onClick={() => setConfirmLeave(true)}
          >
            Leave competitions
          </button>
        </div>
      </BottomSheet>

      <div className="mx-auto max-w-4xl">
        <PageHeader
          actions={
            competition?.enabled ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                type="button"
                onClick={() => setShowSettings(true)}
              >
                <Settings aria-hidden="true" className="h-4 w-4" />
                Settings
              </button>
            ) : null
          }
          description={
            competition?.enabled ? (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                <CityIcon className="h-4 w-4 text-zinc-500" />
                {competition.cityName}, {competition.countryName}
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm font-semibold text-zinc-300">{viewerDivisionLabel(competition)}</span>
              </span>
            ) : null
          }
          eyebrow="Compete"
          title="Leaderboards"
        />

        {loading ? <div aria-busy="true" className="h-96 animate-pulse rounded-[2rem] bg-white/[0.03]" /> : null}
        {error && !loading ? <ErrorState message={error} /> : null}

        {!loading && !error && competition && !competition.enabled ? <JoinHero error={formError} submitting={saving} onJoin={saveCompetition} /> : null}

        {!loading && competition?.enabled && filters ? (
          <div className="space-y-5">
            <div aria-label="Board" className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="group">
              {BOARD_TYPES.map((type) => (
                <button
                  aria-pressed={filters.type === type.value}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    filters.type === type.value ? "border-forge-ember bg-forge-ember text-[#160a02]" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white"
                  }`}
                  key={type.value}
                  type="button"
                  onClick={() => update({ type: type.value })}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl className="w-full sm:w-auto" fill options={SCOPE_OPTIONS} value={filters.scope} onChange={(scope) => update({ scope })} />
              <SegmentedControl className="w-full sm:w-auto" fill options={PERIOD_OPTIONS} value={filters.period} onChange={(period) => update({ period })} />
              <PillSelect label="Gender division" options={GENDER_OPTIONS} value={filters.gender} onChange={(gender) => update({ gender })} />
              <PillSelect label="Age division" options={AGE_OPTIONS} value={filters.age} onChange={(age) => update({ age })} />
            </div>

            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="leading-6 text-zinc-400">
                <span className="font-semibold text-zinc-200">{activeType?.label}:</span> {activeType?.explain}
              </p>
              {isPinned ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-emerald-300">
                  <Check aria-hidden="true" className="h-4 w-4" /> On your nav badge
                </span>
              ) : (
                <button className="inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start rounded-full px-3 font-bold text-orange-300 hover:bg-white/[0.05] sm:self-auto" type="button" onClick={pinBoard}>
                  <PinnedIcon aria-hidden="true" className="h-4 w-4" />
                  Show on my nav badge
                </button>
              )}
            </div>

            {leaderboard ? (
              <div className={`transition-opacity ${boardLoading ? "opacity-60" : ""}`}>
                <LeaderboardView leaderboard={leaderboard} unit={unit} viewerDivision={viewerDivisionLabel(competition)} />
              </div>
            ) : (
              <div aria-busy="true" className="h-80 animate-pulse rounded-[2rem] bg-white/[0.03]" />
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default CompetePage;
