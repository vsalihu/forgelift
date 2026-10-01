import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MissionCard from "../components/missions/MissionCard.jsx";
import MissionCompleteAnimation from "../components/missions/MissionCompleteAnimation.jsx";
import MissionDetailModal from "../components/missions/MissionDetailModal.jsx";
import WeekHero from "../components/missions/WeekHero.jsx";
import { formatShortDate } from "../components/missions/missionMeta.js";
import { ErrorIcon, FlameIcon, GoalIcon, SuccessIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { missionService } from "../services/missionService.js";

const statusStyle = {
  completed: { icon: SuccessIcon, className: "text-emerald-300", label: "Completed" },
  failed: { icon: ErrorIcon, className: "text-red-300", label: "Missed" },
  expired: { icon: ErrorIcon, className: "text-zinc-500", label: "Expired" }
};

const MissionsPage = () => {
  const [weeklyTarget, setWeeklyTarget] = useState(null);
  const [activeMissions, setActiveMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [selectedMission, setSelectedMission] = useState(null);
  const [completedPopup, setCompletedPopup] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const applyMissionData = (data) => {
    setWeeklyTarget(data.weeklyTarget || null);
    setActiveMissions(data.activeMissions || []);
    setCompletedMissions(data.completedMissions || []);
    setStreaks(data.streaks || []);
  };

  const loadMissions = async () => {
    setLoading(true);
    setError("");
    try {
      const [missionData, historyData] = await Promise.all([missionService.getMissions(), missionService.getMissionHistory()]);
      applyMissionData(missionData);
      setHistory(historyData.missions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      applyMissionData(await missionService.recalculateMissions());
      const historyData = await missionService.getMissionHistory();
      setHistory(historyData.missions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleCompleteMission = async (missionId) => {
    setError("");
    try {
      const completedMission = [...activeMissions, ...completedMissions, ...history].find((mission) => mission._id === missionId);
      applyMissionData(await missionService.updateMissionStatus(missionId, "completed"));
      const historyData = await missionService.getMissionHistory();
      setHistory(historyData.missions || []);
      setSelectedMission(null);
      if (completedMission) setCompletedPopup([{ ...completedMission, status: "completed" }]);
    } catch (err) {
      setError(err.message);
    }
  };

  const missionStreak = streaks.find((streak) => streak.streakType === "mission_completion");
  const weekStreak = streaks.find((streak) => streak.streakType === "weekly_workout");
  const xpEarned = completedMissions.reduce((sum, mission) => sum + (mission.xpReward || 0), 0);
  const xpAvailable = activeMissions.reduce((sum, mission) => sum + (mission.xpReward || 0), 0);
  const completedIds = new Set(completedMissions.map((mission) => mission._id));
  const pastMissions = history.filter((mission) => !completedIds.has(mission._id) && mission.status !== "active");
  const shownHistory = showAllHistory ? pastMissions : pastMissions.slice(0, 6);

  return (
    <>
      <Layout>
        <div className="mx-auto max-w-5xl">
          <PageHeader
            actions={
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60"
                disabled={recalculating}
                type="button"
                onClick={handleRecalculate}
              >
                <RefreshCw aria-hidden="true" className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
                {recalculating ? "Refreshing…" : "Refresh plan"}
              </button>
            }
            description="Built each week from your ranks, recovery, weak points and overload targets. Finish them for XP."
            eyebrow="Missions"
            title="This week's missions"
            tutorialPageKey="missions"
          />

          {error ? <ErrorState message={error} onRetry={loadMissions} /> : null}

          {loading ? (
            <div aria-busy="true" aria-label="Loading missions" className="space-y-4">
              <div className="h-72 animate-pulse rounded-[2rem] bg-white/[0.04]" />
              <div className="h-48 animate-pulse rounded-3xl bg-white/[0.03]" />
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              <WeekHero
                activeCount={activeMissions.length}
                completedCount={completedMissions.length}
                missionStreak={missionStreak}
                weekStreak={weekStreak}
                weeklyTarget={weeklyTarget}
                xpAvailable={xpAvailable}
                xpEarned={xpEarned}
              />

              <section aria-labelledby="active-heading" className="mt-10" data-tour-id="missions-active-list">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl text-white" id="active-heading">
                    In progress
                  </h2>
                  {activeMissions.length ? (
                    <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
                      <FlameIcon aria-hidden="true" className="h-4 w-4 text-orange-300" />
                      {xpAvailable} XP up for grabs
                    </span>
                  ) : null}
                </div>

                {activeMissions.length ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {activeMissions.map((mission, index) => (
                      <div data-tour-id={index === 0 ? "mission-card" : undefined} key={mission._id}>
                        <MissionCard index={index} mission={mission} onComplete={handleCompleteMission} onOpen={setSelectedMission} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-10 text-center">
                    <GoalIcon className="mx-auto h-10 w-10 text-orange-300" />
                    <h3 className="font-display mt-4 text-2xl text-white">{completedMissions.length ? "All done this week." : "No missions yet."}</h3>
                    <p className="mx-auto mt-2 max-w-sm text-zinc-400">
                      {completedMissions.length ? "New missions arrive with next week's plan." : "Log a workout or refresh the plan and ForgeLift builds this week's missions."}
                    </p>
                    {!completedMissions.length ? (
                      <Link className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02]" to="/gym-mode">
                        <GymModeIcon className="h-4 w-4" />
                        Start Gym Mode
                      </Link>
                    ) : null}
                  </div>
                )}
              </section>

              {completedMissions.length ? (
                <section aria-labelledby="done-heading" className="mt-10">
                  <h2 className="font-display mb-4 text-2xl text-white" id="done-heading">
                    Done this week
                  </h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {completedMissions.map((mission) => (
                      <li key={mission._id}>
                        <button
                          className="flex w-full items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3 text-left transition-colors hover:bg-emerald-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                          type="button"
                          onClick={() => setSelectedMission(mission)}
                        >
                          <SuccessIcon className="h-5 w-5 shrink-0 text-emerald-300" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{mission.title}</span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-orange-200">+{mission.xpReward || 0} XP</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {pastMissions.length ? (
                <section aria-labelledby="past-heading" className="mt-10">
                  <h2 className="mb-3 text-sm font-semibold text-zinc-300" id="past-heading">
                    Earlier weeks
                  </h2>
                  <ul className="divide-y divide-white/[0.05] rounded-3xl border border-white/[0.06] bg-white/[0.02]">
                    {shownHistory.map((mission) => {
                      const status = statusStyle[mission.status] || statusStyle.expired;
                      const Icon = status.icon;
                      return (
                        <li className="flex items-center gap-3 px-4 py-3" key={mission._id}>
                          <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${status.className}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-zinc-200">{mission.title}</span>
                            <span className="block text-xs text-zinc-500">
                              {status.label}
                              {mission.endDate ? ` · week of ${formatShortDate(mission.startDate || mission.endDate)}` : ""}
                            </span>
                          </span>
                          <span className={`shrink-0 text-sm font-bold tabular-nums ${mission.status === "completed" ? "text-orange-200" : "text-zinc-600 line-through"}`}>
                            +{mission.xpReward || 0}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {pastMissions.length > 6 ? (
                    <button className="mt-3 text-sm font-semibold text-orange-300 hover:text-orange-200" type="button" onClick={() => setShowAllHistory((value) => !value)}>
                      {showAllHistory ? "Show less" : `Show all ${pastMissions.length}`}
                    </button>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </Layout>
      <MissionDetailModal mission={selectedMission} onClose={() => setSelectedMission(null)} onComplete={handleCompleteMission} />
      <MissionCompleteAnimation missions={completedPopup} onClose={() => setCompletedPopup([])} />
    </>
  );
};

export default MissionsPage;
