import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lock, Trophy, UserCheck, UserMinus, UserPlus } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import RankProgressCard from "../components/ranks/RankProgressCard.jsx";
import MuscleRankCard from "../components/ranks/MuscleRankCard.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import MetricCard from "../components/ui/MetricCard.jsx";
import { friendService } from "../services/friendService.js";
import { profileService } from "../services/profileService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (date) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(date));

const PublicProfilePage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [savedTemplateIds, setSavedTemplateIds] = useState([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await profileService.getProfile(username);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const sendRequest = async () => {
    setActionBusy(true);
    try {
      await friendService.sendRequest(username);
      await loadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const respondToRequest = async (accept) => {
    setActionBusy(true);
    try {
      if (accept) await friendService.acceptRequest(data.friendRequestId);
      else await friendService.declineRequest(data.friendRequestId);
      await loadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRemoveFriend = () => {
    setError("");
    setShowRemoveConfirm(false);
    setData((current) => ({ ...current, isFriend: false, friendRequestStatus: "none" }));

    friendService.removeFriend(data.profile._id).catch((err) => {
      setError(err.message);
      loadProfile();
    });
  };

  const saveWorkout = async (template) => {
    setActionBusy(true);
    try {
      await workoutTemplateService.createTemplate({
        name: template.name,
        description: template.description,
        exercises: template.exercises
      });
      setSavedTemplateIds((ids) => [...ids, template._id]);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSkeleton rows={5} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorState message={error} onRetry={loadProfile} />
      </Layout>
    );
  }

  if (!data) return null;

  const { profile, isSelf, isFriend, friendRequestStatus } = data;

  const friendActionButton = () => {
    if (isSelf) return null;
    if (isFriend) {
      return (
        <Button loading={actionBusy} type="button" variant="ghost" onClick={() => setShowRemoveConfirm(true)}>
          <UserMinus className="h-4 w-4" />
          Remove Friend
        </Button>
      );
    }
    if (friendRequestStatus === "sent") {
      return <Button disabled type="button" variant="secondary"><UserCheck className="h-4 w-4" />Request Sent</Button>;
    }
    if (friendRequestStatus === "received") {
      return (
        <div className="flex gap-2">
          <Button loading={actionBusy} type="button" onClick={() => respondToRequest(true)}>Accept</Button>
          <Button type="button" variant="ghost" onClick={() => respondToRequest(false)}>Decline</Button>
        </div>
      );
    }
    return (
      <Button loading={actionBusy} type="button" onClick={sendRequest}>
        <UserPlus className="h-4 w-4" />
        Add Friend
      </Button>
    );
  };

  return (
    <Layout>
      {showRemoveConfirm ? (
        <ConfirmModal
          title="Remove this friend?"
          description={`Remove @${username} as a friend?`}
          confirmLabel="Remove"
          onCancel={() => setShowRemoveConfirm(false)}
          onConfirm={confirmRemoveFriend}
        />
      ) : null}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Profile</p>
          <h1 className="mt-2 text-3xl font-black text-white">{profile.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            @{profile.username} · Joined {formatDate(profile.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSelf ? (
            <Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15" to="/profile">
              Edit Profile Settings
            </Link>
          ) : (
            friendActionButton()
          )}
        </div>
      </div>

      {!isSelf && !isFriend ? (
        <div className="metal-panel rounded-xl p-8 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-forge-copper" />
          <p className="text-lg font-bold text-white">This profile is private</p>
          <p className="mt-2 text-sm text-slate-400">
            {profile.currentOverallRank} rank. Add @{profile.username} as a friend to see their full stats, ranks, and public workouts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <RankProgressCard
            overallRank={profile.currentOverallRank}
            overallScore={profile.overallRankScore}
            overallProgress={profile.overallProgress}
            xp={profile.xp}
          />

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Lifetime volume" value={`${formatNumber(profile.lifetimeVolume)}kg`} />
            <MetricCard label="Lifetime reps" value={formatNumber(profile.lifetimeReps)} />
            <MetricCard label="Lifetime sets" value={formatNumber(profile.lifetimeSets)} />
            <MetricCard label="Workouts logged" value={formatNumber(profile.lifetimeWorkoutCount)} />
          </section>

          {data.muscleRanks?.length ? (
            <section>
              <h2 className="mb-3 text-lg font-bold text-white">Muscle ranks</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.muscleRanks.map((muscleRank) => (
                  <MuscleRankCard key={muscleRank.muscleGroup} muscleRank={muscleRank} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">
              {isSelf ? "Your public workouts" : "Public workouts"}
            </h2>
            {data.publicWorkouts?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.publicWorkouts.map((template) => (
                  <article className="metal-panel rounded-lg p-5" key={template._id}>
                    <p className="text-lg font-black text-white">{template.name}</p>
                    {template.description ? <p className="mt-1 text-sm text-slate-400">{template.description}</p> : null}
                    <p className="mt-2 text-sm text-forge-copper">
                      {template.exercises?.map((exercise) => exercise.exerciseName).join(", ")}
                    </p>
                    {!isSelf ? (
                      <Button
                        className="mt-3"
                        disabled={savedTemplateIds.includes(template._id)}
                        loading={actionBusy}
                        type="button"
                        variant="secondary"
                        onClick={() => saveWorkout(template)}
                      >
                        {savedTemplateIds.includes(template._id) ? "Saved to your templates" : "Save to My Templates"}
                      </Button>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No public workouts" description={isSelf ? "Mark a workout public from Design a Workout to show it here." : "Nothing marked public yet."} />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Recent activity</h2>
            {data.recentActivity?.length ? (
              <div className="space-y-3">
                {data.recentActivity.map((item) => (
                  <article className="metal-panel rounded-lg p-4" key={item._id}>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatNumber(item.totalVolume)}kg volume · {item.totalSets} sets · {item.totalReps} reps
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Trophy} title="No workouts logged yet" description="Completed workouts will show up here." />
            )}
          </section>
        </div>
      )}
    </Layout>
  );
};

export default PublicProfilePage;
