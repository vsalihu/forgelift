import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import Avatar from "../components/social/Avatar.jsx";
import { timeAgo } from "../components/social/timeAgo.js";
import { ChallengeIcon } from "../components/icons/featureIcons.jsx";
import { ChatIcon, DumbbellIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { chatService } from "../services/chatService.js";

const Preview = ({ conversation }) => {
  if (conversation.lastMessageType === "challenge") {
    return (
      <span className="inline-flex items-center gap-1.5 text-orange-200">
        <ChallengeIcon aria-hidden="true" className="h-3.5 w-3.5" /> Challenge
      </span>
    );
  }
  if (conversation.lastMessageType === "workout_session") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sky-200">
        <DumbbellIcon aria-hidden="true" className="h-3.5 w-3.5" /> Workout together
      </span>
    );
  }
  return conversation.lastMessageText || <span className="text-zinc-600">Say hello</span>;
};

const ChatListPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          actions={
            <Link className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09]" to="/friends">
              Find friends
            </Link>
          }
          description="Message friends, send challenges and train together live."
          eyebrow="Chat"
          title="Messages"
        />

        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loading ? (
          <div aria-busy="true" className="space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div className="h-[4.75rem] animate-pulse rounded-2xl bg-white/[0.03]" key={item} />
            ))}
          </div>
        ) : null}

        {!loading && !error && !conversations.length ? (
          <EmptyPanel action={false} icon={ChatIcon} title="No conversations yet.">
            Open a friend from the Friends page to message them, send a challenge, or start a workout together.
          </EmptyPanel>
        ) : null}

        <ul className="space-y-2">
          {conversations.map((conversation) => {
            const unread = conversation.unreadCount > 0;
            return (
              <li key={conversation._id}>
                <Link
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    unread ? "border-forge-ember/30 bg-forge-ember/[0.05]" : "border-white/[0.07] bg-white/[0.025]"
                  }`}
                  to={`/chat/${conversation.otherUser.username}`}
                >
                  <Avatar name={conversation.otherUser.name} rank={conversation.otherUser.currentOverallRank} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate ${unread ? "font-bold text-white" : "font-semibold text-zinc-100"}`}>{conversation.otherUser.name}</span>
                      <span className={`shrink-0 text-xs tabular-nums ${unread ? "text-orange-300" : "text-zinc-500"}`}>{timeAgo(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-3">
                      <span className={`min-w-0 truncate text-sm ${unread ? "text-zinc-200" : "text-zinc-500"}`}>
                        <Preview conversation={conversation} />
                      </span>
                      {unread ? (
                        <span className="shrink-0 rounded-full bg-forge-ember px-2 py-0.5 text-xs font-black text-[#160a02]">
                          {conversation.unreadCount}
                          <span className="sr-only"> unread</span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </Layout>
  );
};

export default ChatListPage;
