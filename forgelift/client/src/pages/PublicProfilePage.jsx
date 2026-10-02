import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MuscleRankTile from "../components/ranks/MuscleRankTile.jsx";
import RankHero from "../components/ranks/RankHero.jsx";
import PublicTrainingCalendar from "../components/calendar/PublicTrainingCalendar.jsx";
import NewChallengeModal from "../components/chat/NewChallengeModal.jsx";
import SafetyActions from "../components/compete/SafetyActions.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import StatTile from "../components/analytics/StatTile.jsx";
import Avatar from "../components/social/Avatar.jsx";
import { timeAgo } from "../components/social/timeAgo.js";
import { challengeService } from "../services/challengeService.js";
import { friendService } from "../services/friendService.js";
import { profileService } from "../services/profileService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { AddFriendIcon, BlockIcon, ChallengeIcon, CityIcon, FriendAddedIcon, PrivateIcon, RemoveFriendIcon } from "../components/icons/featureIcons.jsx";
import { ChatIcon, HistoryIcon } from "../components/icons/navIcons.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const compact = (value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
const formatDate = (date) => (date && !Number.isNaN(new Date(date).getTime()) ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(date)) : "");

const PublicProfilePage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [savedTemplateIds, setSavedTemplateIds] = useState([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const navigate = useNavigate();

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
      setActionError(err.message);
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
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRemoveFriend = () => {
    setActionError("");
    setShowRemoveConfirm(false);
    setData((current) => ({ ...current, isFriend: false, friendRequestStatus: "none" }));

    friendService.removeFriend(data.profile._id).catch((err) => {
      setActionError(err.message);
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
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const sendChallenge = async ({ metric, durationDays }) => {
    setChallengeBusy(true);
    try {
      await challengeService.createChallenge({ friendUserId: data.profile._id, metric, durationDays });
      setChallengeOpen(false);
      navigate(`/chat/${username}`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setChallengeBusy(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div aria-busy="true" className="space-y-4">
          <div className="h-40 animate-pulse rounded-[2rem] bg-white/[0.03]" />
          <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />
        </div>
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
  const interaction = data.interaction || {};
  const isBlocked = Boolean(interaction.isBlockedByMe);

  const pill =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50";
  const primary =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50";

  const friendActionButton = () => {
    if (isSelf) return null;
    if (isFriend) {
      return (
        <button className={`${pill} text-zinc-300`} disabled={actionBusy} type="button" onClick={() => setShowRemoveConfirm(true)}>
          <RemoveFriendIcon aria-hidden="true" className="h-4 w-4" />
          Remove friend
        </button>
      );
    }
    if (friendRequestStatus === "sent") {
      return (
        <button className={pill} disabled type="button">
          <FriendAddedIcon aria-hidden="true" className="h-4 w-4" />
          Request sent
        </button>
      );
    }
    if (friendRequestStatus === "received") {
      return (
        <>
          <button className={primary} disabled={actionBusy} type="button" onClick={() => respondToRequest(true)}>
            <FriendAddedIcon aria-hidden="true" className="h-4 w-4" />
            Accept request
          </button>
          <button className={pill} disabled={actionBusy} type="button" onClick={() => respondToRequest(false)}>
            Decline
          </button>
        </>
      );
    }
    return (
      <button className={primary} disabled={actionBusy} type="button" onClick={sendRequest}>
        <AddFriendIcon aria-hidden="true" className="h-4 w-4" />
        Add friend
      </button>
    );
  };

  const card = "rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01]";
  const lockedNote = (Icon, title, text) => (
    <div className={`${card} px-6 py-12 text-center`}>
      <Icon aria-hidden="true" className="mx-auto h-10 w-10 text-orange-300" />
      <p className="font-display mt-3 text-2xl text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );

  return (
    <Layout>
      {showRemoveConfirm ? (
        <ConfirmModal
          confirmLabel="Remove"
          description={`You'll stop seeing each other's workouts and won't be able to message. You can add @${username} again later.`}
          title={`Remove ${profile.name}?`}
          onCancel={() => setShowRemoveConfirm(false)}
          onConfirm={confirmRemoveFriend}
        />
      ) : null}
      <NewChallengeModal open={challengeOpen} opponentName={profile.name} submitting={challengeBusy} onClose={() => setChallengeOpen(false)} onSubmit={sendChallenge} />

      <section className="relative mb-6 overflow-clip rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-forge-ember/[0.1] via-white/[0.02] to-transparent p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={profile.name} rank={profile.currentOverallRank} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display truncate text-3xl leading-tight text-white sm:text-4xl">{profile.name}</h1>
              <p className="mt-0.5 truncate text-sm text-zinc-400">
                @{profile.username}
                {profile.currentOverallRank ? ` · ${profile.currentOverallRank}` : ""}
                {formatDate(profile.createdAt) ? ` · Joined ${formatDate(profile.createdAt)}` : ""}
              </p>
              {profile.competition ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-300">
                  <CityIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-orange-300" />
                  <span className="truncate">
                    {profile.competition.cityName}, {profile.competition.countryName} · on the leaderboards
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSelf ? (
              <Link className={pill} to="/profile">
                Edit your profile
              </Link>
            ) : isBlocked ? null : (
              <>
                {friendActionButton()}
                {isFriend ? (
                  <Link className={pill} to={`/chat/${username}`}>
                    <ChatIcon aria-hidden="true" className="h-4 w-4" />
                    Message
                  </Link>
                ) : null}
                {interaction.canChallenge ? (
                  <button className={pill} type="button" onClick={() => setChallengeOpen(true)}>
                    <ChallengeIcon aria-hidden="true" className="h-4 w-4 text-orange-300" />
                    Challenge
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
        {!isSelf ? (
          <div className="mt-4 border-t border-white/[0.06] pt-2">
            <SafetyActions
              isBlocked={isBlocked}
              username={profile.username}
              onBlockedChange={(blocked) =>
                setData((current) => ({
                  ...current,
                  isFriend: blocked ? false : current.isFriend,
                  friendRequestStatus: blocked ? "none" : current.friendRequestStatus,
                  interaction: { ...current.interaction, isBlockedByMe: blocked, canChallenge: blocked ? false : current.interaction?.canChallenge }
                }))
              }
            />
          </div>
        ) : null}
      </section>

      {actionError ? (
        <p className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {actionError}
        </p>
      ) : null}

      {isBlocked ? (
        lockedNote(BlockIcon, `You blocked @${profile.username}`, "You won't see each other on leaderboards, and they can't message, challenge or friend you. Unblock above to undo.")
      ) : !isSelf && !isFriend ? (
        lockedNote(
          PrivateIcon,
          "Only friends see the details",
          `Add @${profile.username} as a friend to see their ranks, stats and public workouts.${interaction.canChallenge ? " You can still challenge them, since you both compete." : ""}`
        )
      ) : (
        <div className="space-y-8">
          <RankHero overallProgress={profile.overallProgress} overallRank={profile.currentOverallRank} overallScore={profile.overallRankScore} xp={profile.xp} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Workouts" tone="accent" value={formatNumber(profile.lifetimeWorkoutCount)} />
            <StatTile label="Volume lifted" sub="Weight × reps, all time" value={compact(profile.lifetimeVolume)} />
            <StatTile label="Sets" value={formatNumber(profile.lifetimeSets)} />
            <StatTile label="Reps" value={formatNumber(profile.lifetimeReps)} />
          </div>

          <PublicTrainingCalendar username={username} />

          {data.muscleRanks?.some((muscleRank) => muscleRank.workoutCount > 0) ? (
            <section>
              <h2 className="font-display mb-3 text-2xl text-white">Muscle ranks</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...data.muscleRanks]
                  .filter((muscleRank) => muscleRank.workoutCount > 0)
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((muscleRank, index) => (
                    <MuscleRankTile index={index} key={muscleRank.muscleGroup} muscleRank={muscleRank} />
                  ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="font-display mb-3 text-2xl text-white">{isSelf ? "Your public workouts" : "Public workouts"}</h2>
            {data.publicWorkouts?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.publicWorkouts.map((template) => {
                  const saved = savedTemplateIds.includes(template._id);
                  return (
                    <article className={`${card} flex flex-col p-4 sm:p-5`} key={template._id}>
                      <h3 className="font-display text-lg text-white">{template.name}</h3>
                      <p className="mt-0.5 text-sm text-zinc-500">{template.exercises?.length || 0} exercises</p>
                      {template.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{template.description}</p> : null}
                      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-300">{template.exercises?.map((exercise) => exercise.exerciseName).join(" · ")}</p>
                      {!isSelf ? (
                        <button className={`${pill} mt-4 self-start`} disabled={saved || actionBusy} type="button" onClick={() => saveWorkout(template)}>
                          {saved ? "Saved to your workouts" : "Save to my workouts"}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-3xl border border-dashed border-white/12 p-6 text-center text-sm text-zinc-400">
                {isSelf ? "Make a workout public in Design a Workout and it shows here." : "Nothing shared yet."}
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display mb-3 text-2xl text-white">Recent workouts</h2>
            {data.recentActivity?.length ? (
              <ul className="space-y-2">
                {data.recentActivity.map((item) => (
                  <li className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:p-4" key={item._id}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-forge-ember/15 text-orange-300">
                      <HistoryIcon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-white">{item.title || "Workout"}</span>
                      <span className="block text-sm text-zinc-500">
                        {item.totalSets} sets · {formatNumber(item.totalReps)} reps · {compact(item.totalVolume)} volume
                      </span>
                    </span>
                    {item.createdAt ? <span className="shrink-0 text-xs text-zinc-500">{timeAgo(item.createdAt)}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl border border-dashed border-white/12 p-6 text-center text-sm text-zinc-400">No workouts logged yet.</p>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
};

export default PublicProfilePage;
