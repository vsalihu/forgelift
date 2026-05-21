import { useEffect, useState } from "react";
import { RefreshCw, Target } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import MissionCard from "../components/missions/MissionCard.jsx";
import MissionCompleteAnimation from "../components/missions/MissionCompleteAnimation.jsx";
import MissionDetailModal from "../components/missions/MissionDetailModal.jsx";
import MissionSummaryCard from "../components/missions/MissionSummaryCard.jsx";
import WeeklyTargetCard from "../components/missions/WeeklyTargetCard.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import { missionService } from "../services/missionService.js";
import { helpText } from "../utils/helpText.js";

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
      const [missionData, historyData] = await Promise.all([
        missionService.getMissions(),
        missionService.getMissionHistory()
      ]);
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
      const data = await missionService.recalculateMissions();
      applyMissionData(data);
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
      const data = await missionService.updateMissionStatus(missionId, "completed");
      applyMissionData(data);
      const historyData = await missionService.getMissionHistory();
      setHistory(historyData.missions || []);
      setSelectedMission(null);
      if (completedMission) {
        setCompletedPopup([{ ...completedMission, status: "completed" }]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const missionCompletionStreak = streaks.find((streak) => streak.streakType === "mission_completion");
  const weeklyWorkoutStreak = streaks.find((streak) => streak.streakType === "weekly_workout");

  return (
    <>
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Missions</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Weekly action plan <HelpTooltip {...helpText.mission} />
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            ForgeLift turns ranks, recovery, weak points, overload, and deload data into clear weekly targets.
          </p>
        </div>
        <Button loading={recalculating} type="button" onClick={handleRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>

      {loading ? <p className="text-forge-steel">Loading missions...</p> : null}
      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>Weekly Target <HelpTooltip title="Weekly Target" content="Your planned workout and muscle focus for the week." example="Complete 3 workouts and train back directly." size="xs" /></span>
        <span>XP Reward <HelpTooltip {...helpText.xp} size="xs" /></span>
        <span>Priority <HelpTooltip title="Priority" content="How important the mission is based on recovery, weak points, deloads, and your goal path." example="A deload compliance mission may be High priority." size="xs" /></span>
        <span>Progress <HelpTooltip title="Mission Progress" content="How close you are to finishing the mission." example="1/2 pull sessions completed." size="xs" /></span>
      </div>

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <WeeklyTargetCard weeklyTarget={weeklyTarget} />
            <section className="metal-panel rounded-lg p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Mission Summary</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MissionSummaryCard title="Active" value={activeMissions.length} note="Current week" />
                <MissionSummaryCard title="Completed" value={completedMissions.length} note="This week" />
                <MissionSummaryCard
                  title="Mission streak"
                  value={missionCompletionStreak?.currentCount || 0}
                  note={`Best ${missionCompletionStreak?.bestCount || 0}`}
                />
                <MissionSummaryCard
                  title="Weekly target streak"
                  value={weeklyWorkoutStreak?.currentCount || 0}
                  note={`Best ${weeklyWorkoutStreak?.bestCount || 0}`}
                />
              </div>
            </section>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Active Missions</p>
                <h2 className="mt-2 text-xl font-black text-white">Focus for this week</h2>
              </div>
            </div>

            {activeMissions.length ? (
              <div className="space-y-5">
                {activeMissions.map((mission) => (
                  <MissionCard key={mission._id} mission={mission} onComplete={handleCompleteMission} onOpen={setSelectedMission} />
                ))}
              </div>
            ) : (
              <div className="metal-panel rounded-lg p-8 text-center">
                <Target className="mx-auto h-10 w-10 text-forge-copper" />
                <h3 className="mt-4 text-lg font-bold text-white">No active missions</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Recalculate missions or log a workout to generate a fresh weekly plan.
                </p>
              </div>
            )}
          </section>

          <section className="metal-panel rounded-lg p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Completed This Week</p>
            {completedMissions.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {completedMissions.map((mission) => (
                  <div className="rounded-md bg-green-500/10 p-4 text-sm" key={mission._id}>
                    <p className="font-bold text-white">{mission.title}</p>
                    <p className="mt-1 text-green-200">+{mission.xpReward || 0} XP</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No missions completed this week yet.</p>
            )}
          </section>

          <section className="metal-panel rounded-lg p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">History</p>
            {history.length ? (
              <div className="mt-4 space-y-3">
                {history.slice(0, 8).map((mission) => (
                  <div className="flex flex-col gap-2 rounded-md bg-black/20 p-3 text-sm sm:flex-row sm:items-center sm:justify-between" key={mission._id}>
                    <div>
                      <p className="font-bold text-white">{mission.title}</p>
                      <p className="text-slate-400">{mission.status}</p>
                    </div>
                    <p className="text-forge-copper">+{mission.xpReward || 0} XP</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Mission history will appear after missions complete or expire.</p>
            )}
          </section>
        </div>
      ) : null}
    </Layout>
      <MissionDetailModal
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
        onComplete={handleCompleteMission}
      />
      <MissionCompleteAnimation missions={completedPopup} onClose={() => setCompletedPopup([])} />
    </>
  );
};

export default MissionsPage;
