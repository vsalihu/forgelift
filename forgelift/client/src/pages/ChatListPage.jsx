import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, MessageCircle, Trophy } from "lucide-react";
import Layout from "../components/Layout.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { chatService } from "../services/chatService.js";

const formatRelativeTime = (date) => {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
};

const previewFor = (conversation) => {
  if (conversation.lastMessageType === "challenge") return "🏆 Challenge";
  if (conversation.lastMessageType === "workout_session") return "💪 Workout together";
  return conversation.lastMessageText || "Say hello";
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
      <PageHeader
        eyebrow="Social"
        title="Chat"
        description="Message friends, send challenges, and train together in real time."
        actions={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            to="/friends"
          >
            Find friends
          </Link>
        }
      />

      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? <LoadingSkeleton rows={4} /> : null}

      {!loading && !conversations.length ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Message a friend from the Friends page to start a chat, send a challenge, or train together."
        />
      ) : null}

      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Link
            className="metal-panel flex items-center justify-between gap-3 rounded-lg p-4 transition hover:bg-white/5"
            key={conversation._id}
            to={`/chat/${conversation.otherUser.username}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-forge-ember">
                {conversation.lastMessageType === "challenge" ? (
                  <Trophy className="h-5 w-5" />
                ) : conversation.lastMessageType === "workout_session" ? (
                  <Dumbbell className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="font-bold text-white">{conversation.otherUser.name}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-400">{previewFor(conversation)}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs text-slate-500">{formatRelativeTime(conversation.lastMessageAt)}</span>
              {conversation.unreadCount ? (
                <span className="rounded-full bg-forge-ember px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default ChatListPage;
