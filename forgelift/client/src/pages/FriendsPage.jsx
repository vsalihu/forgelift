import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Search, Trophy, UserMinus, UserPlus, Users } from "lucide-react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { activityService } from "../services/activityService.js";
import { friendService } from "../services/friendService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const tabs = [
  { value: "feed", label: "Feed" },
  { value: "friends", label: "Friends" },
  { value: "workouts", label: "Workouts" },
  { value: "leaderboard", label: "Leaderboard" }
];

const FriendsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [publicWorkouts, setPublicWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState("");
  const [savedInboxIds, setSavedInboxIds] = useState([]);
  const [savedPublicIds, setSavedPublicIds] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [feedData, friendsData, incomingData, sentData, leaderboardData, inboxData, publicData] = await Promise.all([
        activityService.getFeed(),
        friendService.getFriends(),
        friendService.getRequests(),
        friendService.getRequests("sent"),
        friendService.getLeaderboard(),
        activityService.getInbox(),
        workoutTemplateService.getFriendsPublicTemplates()
      ]);
      setFeed(feedData.feed || []);
      setFriends(friendsData.friends || []);
      setIncomingRequests(incomingData.requests || []);
      setSentRequests(sentData.requests || []);
      setLeaderboard(leaderboardData.leaderboard || []);
      setInbox(inboxData.inbox || []);
      setPublicWorkouts(publicData.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await friendService.searchUsers(searchQuery.trim());
      setSearchResults(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (username) => {
    setBusyId(username);
    try {
      await friendService.sendRequest(username);
      const sentData = await friendService.getRequests("sent");
      setSentRequests(sentData.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const respondToRequest = async (id, accept) => {
    setBusyId(id);
    try {
      if (accept) await friendService.acceptRequest(id);
      else await friendService.declineRequest(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const confirmRemoveFriend = async () => {
    const friendUserId = pendingRemoveId;
    if (!friendUserId) return;
    setBusyId(friendUserId);
    try {
      await friendService.removeFriend(friendUserId);
      await loadAll();
      setPendingRemoveId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const saveInboxWorkout = async (sharedWorkoutId) => {
    setBusyId(sharedWorkoutId);
    try {
      await activityService.saveInboxWorkout(sharedWorkoutId);
      setSavedInboxIds((ids) => [...ids, sharedWorkoutId]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const savePublicWorkout = async (template) => {
    setBusyId(template._id);
    try {
      await workoutTemplateService.createTemplate({
        name: template.name,
        description: template.description,
        exercises: template.exercises
      });
      setSavedPublicIds((ids) => [...ids, template._id]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const existingUsernames = new Set([
    user?.username,
    ...friends.map((friend) => friend.username),
    ...sentRequests.map((request) => request.recipientId?.username)
  ]);

  return (
    <Layout>
      {pendingRemoveId ? (
        <ConfirmModal
          title="Remove this friend?"
          confirmLabel="Remove"
          loading={busyId === pendingRemoveId}
          onCancel={() => setPendingRemoveId("")}
          onConfirm={confirmRemoveFriend}
        />
      ) : null}
      <PageHeader eyebrow="Social" title="Friends" description="Add friends, share workouts, and compare progress." />

      <SegmentedControl className="mb-6" options={tabs} value={activeTab} onChange={setActiveTab} />

      {error ? <ErrorState message={error} onRetry={loadAll} /> : null}
      {loading ? <LoadingSkeleton rows={4} /> : null}

      {!loading && activeTab === "feed" ? (
        feed.length ? (
          <div className="space-y-4">
            {feed.map((item) => (
              <article className="metal-panel rounded-lg p-5" key={item._id}>
                <p className="font-bold text-white">
                  {item.userId?._id === user?._id ? "You" : item.userId?.name}{" "}
                  <span className="font-normal text-slate-400">@{item.userId?.username}</span>
                </p>
                <p className="mt-2 text-lg font-black text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatNumber(item.totalVolume)}kg volume · {item.totalSets} sets · {item.totalReps} reps · {item.exerciseCount} exercises
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No activity yet"
            description="Add friends and finish a workout to see activity here."
          />
        )
      ) : null}

      {!loading && activeTab === "friends" ? (
        <div className="space-y-6">
          <form className="metal-panel flex flex-col gap-3 rounded-lg p-5 sm:flex-row sm:items-end" onSubmit={runSearch}>
            <FormInput
              className="flex-1"
              label="Add a friend by username"
              placeholder="username"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button loading={searching} type="submit">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>

          {searchResults ? (
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-3 text-lg font-bold text-white">Search results</h2>
              {searchResults.length ? (
                <div className="space-y-2">
                  {searchResults.map((result) => {
                    const alreadyConnected = existingUsernames.has(result.username);
                    return (
                      <div className="flex items-center justify-between rounded-md bg-black/25 p-3" key={result._id}>
                        <Link className="hover:underline" to={`/u/${result.username}`}>
                          <p className="font-bold text-white">{result.name}</p>
                          <p className="text-sm text-slate-400">@{result.username} · {result.currentOverallRank}</p>
                        </Link>
                        <Button
                          disabled={alreadyConnected}
                          loading={busyId === result.username}
                          type="button"
                          variant="secondary"
                          onClick={() => sendRequest(result.username)}
                        >
                          <UserPlus className="h-4 w-4" />
                          {alreadyConnected ? "Pending/Added" : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No users found.</p>
              )}
            </section>
          ) : null}

          {incomingRequests.length ? (
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-3 text-lg font-bold text-white">Friend requests</h2>
              <div className="space-y-2">
                {incomingRequests.map((request) => (
                  <div className="flex items-center justify-between rounded-md bg-black/25 p-3" key={request._id}>
                    <div>
                      <p className="font-bold text-white">{request.requesterId?.name}</p>
                      <p className="text-sm text-slate-400">@{request.requesterId?.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button loading={busyId === request._id} type="button" onClick={() => respondToRequest(request._id, true)}>
                        Accept
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => respondToRequest(request._id, false)}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {sentRequests.length ? (
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-3 text-lg font-bold text-white">Sent requests</h2>
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div className="flex items-center justify-between rounded-md bg-black/25 p-3" key={request._id}>
                    <p className="text-white">@{request.recipientId?.username}</p>
                    <span className="text-sm text-slate-400">Pending</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Your friends ({friends.length})</h2>
            {friends.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {friends.map((friend) => (
                  <div className="metal-panel flex items-center justify-between rounded-lg p-4" key={friend._id}>
                    <Link className="hover:underline" to={`/u/${friend.username}`}>
                      <p className="font-bold text-white">{friend.name}</p>
                      <p className="text-sm text-slate-400">@{friend.username} · {friend.currentOverallRank}</p>
                    </Link>
                    <button
                      className="rounded-md p-2 text-red-300 hover:bg-red-500/10"
                      disabled={busyId === friend._id}
                      type="button"
                      onClick={() => setPendingRemoveId(friend._id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No friends yet" description="Search for a username above to send your first friend request." />
            )}
          </section>
        </div>
      ) : null}

      {!loading && activeTab === "workouts" ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Sent to you</h2>
            {inbox.length ? (
              <div className="space-y-3">
                {inbox.map((item) => (
                  <article className="metal-panel rounded-lg p-5" key={item._id}>
                    <p className="text-sm text-slate-400">From {item.fromUserId?.name} (@{item.fromUserId?.username})</p>
                    <p className="mt-1 text-lg font-black text-white">{item.workoutName}</p>
                    {item.workoutDescription ? <p className="mt-1 text-sm text-slate-400">{item.workoutDescription}</p> : null}
                    <p className="mt-2 text-sm text-forge-copper">
                      {item.exercises?.map((exercise) => exercise.exerciseName).join(", ")}
                    </p>
                    <Button
                      className="mt-3"
                      disabled={savedInboxIds.includes(item._id)}
                      loading={busyId === item._id}
                      type="button"
                      variant="secondary"
                      onClick={() => saveInboxWorkout(item._id)}
                    >
                      {savedInboxIds.includes(item._id) ? "Saved to your templates" : "Save to My Templates"}
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Nothing sent to you yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Browse friends' public workouts</h2>
            {publicWorkouts.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {publicWorkouts.map((template) => (
                  <article className="metal-panel rounded-lg p-5" key={template._id}>
                    <p className="text-sm text-slate-400">By {template.userId?.name} (@{template.userId?.username})</p>
                    <p className="mt-1 text-lg font-black text-white">{template.name}</p>
                    {template.description ? <p className="mt-1 text-sm text-slate-400">{template.description}</p> : null}
                    <p className="mt-2 text-sm text-forge-copper">
                      {template.exercises?.map((exercise) => exercise.exerciseName).join(", ")}
                    </p>
                    <Button
                      className="mt-3"
                      disabled={savedPublicIds.includes(template._id)}
                      loading={busyId === template._id}
                      type="button"
                      variant="secondary"
                      onClick={() => savePublicWorkout(template)}
                    >
                      {savedPublicIds.includes(template._id) ? "Saved to your templates" : "Save to My Templates"}
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Dumbbell} title="No public workouts yet" description="Friends' workouts marked public will show up here." />
            )}
          </section>
        </div>
      ) : null}

      {!loading && activeTab === "leaderboard" ? (
        leaderboard.length ? (
          <div className="metal-panel overflow-x-auto rounded-lg p-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3">XP</th>
                  <th className="p-3">Volume</th>
                  <th className="p-3">Reps</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr className={`border-t border-white/5 ${entry.isSelf ? "bg-forge-ember/10" : ""}`} key={entry._id}>
                    <td className="p-3 font-bold text-white">
                      {index === 0 ? <Trophy className="h-4 w-4 text-yellow-300" /> : index + 1}
                    </td>
                    <td className="p-3 text-white">
                      <Link className="hover:underline" to={`/u/${entry.username}`}>
                        {entry.name} {entry.isSelf ? <span className="text-forge-copper">(you)</span> : null}
                        <span className="block text-xs text-slate-400">@{entry.username}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-slate-300">{entry.currentOverallRank}</td>
                    <td className="p-3 text-slate-300">{formatNumber(entry.xp)}</td>
                    <td className="p-3 text-slate-300">{formatNumber(entry.lifetimeVolume)}kg</td>
                    <td className="p-3 text-slate-300">{formatNumber(entry.lifetimeReps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Trophy} title="Nothing to compare yet" description="Add friends to see how you stack up." />
        )
      ) : null}
    </Layout>
  );
};

export default FriendsPage;
