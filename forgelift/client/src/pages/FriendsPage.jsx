import { Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Avatar from "../components/social/Avatar.jsx";
import FeedCard from "../components/social/FeedCard.jsx";
import FriendLeaderboard from "../components/social/FriendLeaderboard.jsx";
import SharedWorkoutCard from "../components/social/SharedWorkoutCard.jsx";
import SocialTabs from "../components/social/SocialTabs.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import RowMenu from "../components/ui/RowMenu.jsx";
import { AddFriendIcon, FriendAddedIcon } from "../components/icons/featureIcons.jsx";
import { ChatIcon, CompeteIcon, DumbbellIcon, FriendsIcon } from "../components/icons/navIcons.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { activityService } from "../services/activityService.js";
import { friendService } from "../services/friendService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { gymDraftInProgress, startInGymMode } from "../utils/gymHandoff.js";

const PersonRow = ({ person, children }) => (
  <li className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
    <Link aria-label={`${person?.name}'s profile`} to={`/u/${person?.username}`}>
      <Avatar name={person?.name} rank={person?.currentOverallRank} />
    </Link>
    <Link className="min-w-0 flex-1" to={`/u/${person?.username}`}>
      <span className="block truncate font-bold text-white hover:underline">{person?.name}</span>
      <span className="block truncate text-sm text-zinc-500">
        @{person?.username}
        {person?.currentOverallRank ? ` · ${person.currentOverallRank}` : ""}
      </span>
    </Link>
    <div className="flex shrink-0 items-center gap-1.5">{children}</div>
  </li>
);

const smallButton =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50";

const FriendsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activity");
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
  const [pendingRemove, setPendingRemove] = useState(null);
  const [pendingStart, setPendingStart] = useState(null);
  const [savedIds, setSavedIds] = useState([]);

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
    const query = searchQuery.trim().replace(/^@/, "");
    if (!query) return;
    setSearching(true);
    try {
      const data = await friendService.searchUsers(query);
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

  const confirmRemoveFriend = () => {
    const friendUserId = pendingRemove?._id;
    if (!friendUserId) return;
    setError("");
    setPendingRemove(null);
    setFriends((current) => current.filter((friend) => friend._id !== friendUserId));
    setLeaderboard((current) => current.filter((entry) => entry._id !== friendUserId));
    friendService.removeFriend(friendUserId).catch((err) => {
      setError(err.message);
      loadAll();
    });
  };

  const save = async (id, action) => {
    setBusyId(id);
    try {
      await action();
      setSavedIds((ids) => [...ids, id]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const train = (template) => {
    if (gymDraftInProgress()) {
      setPendingStart(template);
      return;
    }
    startInGymMode(template, navigate);
  };

  const connected = useMemo(
    () =>
      new Map([
        [user?.username, "you"],
        ...friends.map((friend) => [friend.username, "friend"]),
        ...sentRequests.map((request) => [request.recipientId?.username, "sent"]),
        ...incomingRequests.map((request) => [request.requesterId?.username, "incoming"])
      ]),
    [user?.username, friends, sentRequests, incomingRequests]
  );

  const tabs = [
    { value: "activity", label: "Activity" },
    { value: "friends", label: `Friends ${friends.length ? friends.length : ""}`.trim(), badge: incomingRequests.length },
    { value: "workouts", label: "Workouts", badge: inbox.length },
    { value: "leaderboard", label: "Leaderboard" }
  ];

  return (
    <Layout>
      {pendingRemove ? (
        <ConfirmModal
          confirmLabel="Remove"
          description={`You'll stop seeing each other's activity and won't be able to message. You can add ${pendingRemove.name} again later.`}
          title={`Remove ${pendingRemove.name}?`}
          onCancel={() => setPendingRemove(null)}
          onConfirm={confirmRemoveFriend}
        />
      ) : null}
      {pendingStart ? (
        <ConfirmModal
          cancelLabel="Keep my workout"
          confirmLabel="Start this one"
          description="You have a Gym Mode workout in progress. Starting this one replaces it."
          title="Replace your workout in progress?"
          tone="primary"
          onCancel={() => setPendingStart(null)}
          onConfirm={() => startInGymMode(pendingStart, navigate)}
        />
      ) : null}

      <div className="mx-auto max-w-4xl">
        <PageHeader description="Train alongside friends: see their sessions, swap workouts and see who's ahead." eyebrow="Friends" title="Your crew" />

        <form className="mb-6 flex gap-2" role="search" onSubmit={runSearch}>
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-4 pr-2 focus-within:border-forge-ember/60">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="sr-only">Find people by username</span>
            <input
              autoCapitalize="none"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500 sm:text-sm"
              placeholder="Find people by username"
              spellCheck="false"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (!event.target.value) setSearchResults(null);
              }}
            />
          </label>
          <button
            className="min-h-12 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-bold text-[#160a02] disabled:opacity-60"
            disabled={searching}
            type="submit"
          >
            {searching ? "Finding…" : "Find"}
          </button>
        </form>

        {searchResults ? (
          <section aria-label="Search results" className="mb-8">
            {searchResults.length ? (
              <ul className="space-y-2">
                {searchResults.map((result) => {
                  const state = connected.get(result.username);
                  return (
                    <PersonRow key={result._id} person={result}>
                      {state === "friend" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                          <FriendAddedIcon className="h-4 w-4" /> Friends
                        </span>
                      ) : state === "sent" ? (
                        <span className="text-sm text-zinc-500">Request sent</span>
                      ) : state === "incoming" ? (
                        <button className={`${smallButton} bg-forge-ember text-[#160a02]`} type="button" onClick={() => setActiveTab("friends")}>
                          Respond
                        </button>
                      ) : state === "you" ? (
                        <span className="text-sm text-zinc-500">You</span>
                      ) : (
                        <button
                          className={`${smallButton} border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]`}
                          disabled={busyId === result.username}
                          type="button"
                          onClick={() => sendRequest(result.username)}
                        >
                          <AddFriendIcon className="h-4 w-4" />
                          {busyId === result.username ? "Sending…" : "Add"}
                        </button>
                      )}
                    </PersonRow>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/12 p-4 text-center text-sm text-zinc-400">Nobody with a username like that.</p>
            )}
          </section>
        ) : null}

        <SocialTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        <div aria-labelledby={`tab-${activeTab}`} className="mt-6" id={`panel-${activeTab}`} role="tabpanel">
          {error ? <ErrorState message={error} onRetry={loadAll} /> : null}
          {loading ? (
            <div aria-busy="true" className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div className="h-28 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
              ))}
            </div>
          ) : null}

          {!loading && activeTab === "activity" ? (
            feed.length ? (
              <div className="space-y-3">
                {feed.map((item) => (
                  <FeedCard isSelf={item.userId?._id === user?._id} item={item} key={item._id} />
                ))}
              </div>
            ) : (
              <EmptyPanel action={false} icon={FriendsIcon} title="Quiet in here.">
                Add a few friends and every workout they finish shows up here.
              </EmptyPanel>
            )
          ) : null}

          {!loading && activeTab === "friends" ? (
            <div className="space-y-8">
              {incomingRequests.length ? (
                <section aria-labelledby="requests-heading">
                  <h2 className="mb-3 text-base font-bold text-white" id="requests-heading">
                    Wants to be friends <span className="font-normal text-zinc-500">{incomingRequests.length}</span>
                  </h2>
                  <ul className="space-y-2">
                    {incomingRequests.map((request) => (
                      <PersonRow key={request._id} person={request.requesterId}>
                        <button className={`${smallButton} text-zinc-400 hover:text-white`} disabled={busyId === request._id} type="button" onClick={() => respondToRequest(request._id, false)}>
                          Decline
                        </button>
                        <button className={`${smallButton} bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]`} disabled={busyId === request._id} type="button" onClick={() => respondToRequest(request._id, true)}>
                          Accept
                        </button>
                      </PersonRow>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section aria-labelledby="friends-heading">
                <h2 className="mb-3 text-base font-bold text-white" id="friends-heading">
                  Friends <span className="font-normal text-zinc-500">{friends.length}</span>
                </h2>
                {friends.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {friends.map((friend) => (
                      <PersonRow key={friend._id} person={friend}>
                        <Link aria-label={`Message ${friend.name}`} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07] hover:text-white" to={`/chat/${friend.username}`}>
                          <ChatIcon className="h-5 w-5" />
                        </Link>
                        <RowMenu items={[{ label: "Remove friend", icon: Trash2, tone: "danger", onClick: () => setPendingRemove(friend) }]} label={`Options for ${friend.name}`} />
                      </PersonRow>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/12 p-5 text-center text-sm text-zinc-400">No friends yet. Find someone by their username above.</p>
                )}
              </section>

              {sentRequests.length ? (
                <section aria-labelledby="sent-heading">
                  <h2 className="mb-3 text-sm font-semibold text-zinc-400" id="sent-heading">
                    Waiting on
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {sentRequests.map((request) => (
                      <li className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300" key={request._id}>
                        @{request.recipientId?.username}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {!loading && activeTab === "workouts" ? (
            <div className="space-y-10">
              <section aria-labelledby="inbox-heading">
                <h2 className="mb-3 text-base font-bold text-white" id="inbox-heading">
                  Sent to you
                </h2>
                {inbox.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {inbox.map((item) => (
                      <SharedWorkoutCard
                        busy={busyId === item._id}
                        description={item.workoutDescription}
                        exercises={item.exercises}
                        from={item.fromUserId}
                        key={item._id}
                        name={item.workoutName}
                        saved={savedIds.includes(item._id)}
                        onSave={() => save(item._id, () => activityService.saveInboxWorkout(item._id))}
                        onStart={() => train({ name: item.workoutName, description: item.workoutDescription || "", exercises: item.exercises || [] })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Nothing sent to you yet. Friends can send you any of their saved workouts.</p>
                )}
              </section>
              <section aria-labelledby="public-heading">
                <h2 className="mb-3 text-base font-bold text-white" id="public-heading">
                  Friends' public workouts
                </h2>
                {publicWorkouts.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {publicWorkouts.map((template) => (
                      <SharedWorkoutCard
                        busy={busyId === template._id}
                        description={template.description}
                        exercises={template.exercises}
                        from={template.userId}
                        key={template._id}
                        label="By"
                        name={template.name}
                        saved={savedIds.includes(template._id)}
                        onSave={() =>
                          save(template._id, () => workoutTemplateService.createTemplate({ name: template.name, description: template.description, exercises: template.exercises }))
                        }
                        onStart={() => train({ name: template.name, description: template.description || "", exercises: template.exercises || [] })}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyPanel action={false} icon={DumbbellIcon} title="No public workouts yet.">
                    When friends mark a workout public, it shows up here for you to save or train.
                  </EmptyPanel>
                )}
              </section>
            </div>
          ) : null}

          {!loading && activeTab === "leaderboard" ? (
            leaderboard.length > 1 ? (
              <FriendLeaderboard entries={leaderboard} />
            ) : (
              <EmptyPanel action={false} icon={CompeteIcon} title="Nobody to beat yet.">
                Add friends to see how you stack up on XP, volume and reps.
              </EmptyPanel>
            )
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default FriendsPage;
