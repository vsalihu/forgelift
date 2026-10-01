import { useCallback, useEffect, useState } from "react";
import { Check, Globe2, MapPin, Pin, Settings, Swords, Trophy, Users } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import CompetitionForm from "../components/compete/CompetitionForm.jsx";
import LeaderboardView, { viewerDivisionLabel } from "../components/compete/LeaderboardView.jsx";
import { AGE_OPTIONS, BOARD_TYPES, GENDER_OPTIONS, PERIOD_OPTIONS, SCOPE_OPTIONS } from "../components/compete/boards.js";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { clearStanding, refreshStanding } from "../hooks/useCompetitionStanding.js";
import { competitionService } from "../services/competitionService.js";
import { safetyService } from "../services/safetyService.js";

const selectClass =
  "min-h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none focus:border-forge-ember";

const JoinHero = ({ submitting, error, onJoin }) => (
  <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
    <section className="rounded-2xl border border-forge-copper/30 bg-gradient-to-br from-forge-copper/15 via-forge-panel to-black/40 p-6">
      <Trophy className="h-10 w-10 text-forge-ember" />
      <h2 className="mt-4 text-2xl font-black text-white">Compete with lifters near you</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Climb leaderboards in your city, your country and the world, against people in your own gender and age division.
      </p>
      <ul className="mt-5 space-y-3 text-sm text-slate-200">
        {[
          [MapPin, "City, country and world leaderboards"],
          [Users, "Divisions by gender and age, plus an Open board for everyone"],
          [Swords, "Boards for volume, PRs, progress, and weight loss or gain"],
          [Globe2, "Challenge anyone who competes, even if you're not friends"]
        ].map(([Icon, text]) => (
          <li className="flex items-center gap-3" key={text}>
            <Icon className="h-4 w-4 shrink-0 text-forge-copper" />
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-5 text-slate-500">
        Workouts that look implausible (a lift jumping more than 20% at once, or far beyond world-class) are kept in your log but
        don&apos;t count on public boards.
      </p>
    </section>
    <section className="metal-panel rounded-2xl p-6">
      <h2 className="mb-5 text-xl font-black text-white">Join competitions</h2>
      <CompetitionForm error={error} submitLabel="Join competitions" submitting={submitting} onSubmit={onJoin} />
    </section>
  </div>
);

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
      setFilters((current) =>
        current || {
          ...next.featured,
          gender: next.genderDivision || "open",
          age: next.ageGroup || "all"
        }
      );
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
    if (!competition?.enabled || !filters) return;
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
    const data = await competitionService.pinBoard({ type, scope, period });
    setCompetition(data.competition);
    refreshStanding({ force: true });
  };

  const leave = async () => {
    await competitionService.leave();
    clearStanding();
    setConfirmLeave(false);
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
    competition?.featured &&
    filters &&
    competition.featured.type === filters.type &&
    competition.featured.scope === filters.scope &&
    competition.featured.period === filters.period;
  const activeType = BOARD_TYPES.find((type) => type.value === filters?.type);

  return (
    <Layout>
      {confirmLeave ? (
        <ConfirmModal
          confirmLabel="Leave"
          description="You'll disappear from all leaderboards. Your workouts aren't affected, and you can rejoin any time."
          title="Leave competitions?"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={leave}
        />
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Compete</p>
          <h1 className="mt-2 text-3xl font-black text-white">Leaderboards</h1>
          {competition?.enabled ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-4 w-4" />
              {competition.cityName}, {competition.countryName} · {viewerDivisionLabel(competition)}
            </p>
          ) : null}
        </div>
        {competition?.enabled ? (
          <Button type="button" variant="secondary" onClick={() => setShowSettings((value) => !value)}>
            <Settings className="h-4 w-4" />
            {showSettings ? "Close settings" : "Settings"}
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingSkeleton rows={5} /> : null}
      {error && !loading ? <ErrorState message={error} /> : null}

      {!loading && !error && competition && !competition.enabled ? (
        <JoinHero error={formError} submitting={saving} onJoin={saveCompetition} />
      ) : null}

      {!loading && competition?.enabled && showSettings ? (
        <section className="metal-panel mb-6 space-y-6 rounded-2xl p-5">
          <div>
            <h2 className="mb-4 text-lg font-black text-white">Competition settings</h2>
            <CompetitionForm error={formError} initial={competition} submitLabel="Save" submitting={saving} onSubmit={saveCompetition} />
          </div>
          <div className="border-t border-white/10 pt-5">
            <h3 className="font-bold text-white">Blocked users</h3>
            {blockedUsers.length ? (
              <ul className="mt-3 space-y-2">
                {blockedUsers.map((blocked) => (
                  <li className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-sm" key={blocked._id}>
                    <span className="text-slate-200">
                      {blocked.name} <span className="text-slate-500">@{blocked.username}</span>
                    </span>
                    <button className="font-semibold text-forge-ember hover:text-orange-300" type="button" onClick={() => unblock(blocked.username)}>
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">You haven&apos;t blocked anyone. You can block someone from their profile.</p>
            )}
          </div>
          <div className="border-t border-white/10 pt-5">
            <Button type="button" variant="danger" onClick={() => setConfirmLeave(true)}>
              Leave competitions
            </Button>
          </div>
        </section>
      ) : null}

      {!loading && competition?.enabled && filters ? (
        <div className="space-y-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2">
              {BOARD_TYPES.map((type) => (
                <button
                  aria-pressed={filters.type === type.value}
                  className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${
                    filters.type === type.value
                      ? "border-forge-ember bg-forge-ember text-white"
                      : "border-white/10 bg-black/25 text-slate-300 hover:bg-white/10"
                  }`}
                  key={type.value}
                  type="button"
                  onClick={() => update({ type: type.value })}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SegmentedControl options={SCOPE_OPTIONS} value={filters.scope} onChange={(scope) => update({ scope })} />
            <SegmentedControl options={PERIOD_OPTIONS} value={filters.period} onChange={(period) => update({ period })} />
            <div className="flex gap-2">
              <select aria-label="Gender division" className={selectClass} value={filters.gender} onChange={(event) => update({ gender: event.target.value })}>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select aria-label="Age division" className={selectClass} value={filters.age} onChange={(event) => update({ age: event.target.value })}>
                {AGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-300">
              <span className="font-bold text-white">{activeType?.label}:</span> {activeType?.explain}
            </p>
            {isPinned ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-300">
                <Check className="h-4 w-4" /> Shown on your nav badge
              </span>
            ) : (
              <Button className="shrink-0" type="button" variant="secondary" onClick={pinBoard}>
                <Pin className="h-4 w-4" />
                Use for my nav badge
              </Button>
            )}
          </div>

          {leaderboard ? (
            <div className={`transition-opacity ${boardLoading ? "opacity-60" : ""}`}>
              <LeaderboardView leaderboard={leaderboard} unit={unit} viewerDivision={viewerDivisionLabel(competition)} />
            </div>
          ) : (
            <LoadingSkeleton rows={4} />
          )}
        </div>
      ) : null}
    </Layout>
  );
};

export default CompetePage;
