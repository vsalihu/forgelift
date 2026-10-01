import { ArrowLeft, Send } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import ChallengeMessageCard from "../components/chat/ChallengeMessageCard.jsx";
import CoopSessionMessageCard from "../components/chat/CoopSessionMessageCard.jsx";
import NewChallengeModal from "../components/chat/NewChallengeModal.jsx";
import Avatar from "../components/social/Avatar.jsx";
import { ChallengeIcon } from "../components/icons/featureIcons.jsx";
import { DumbbellIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { challengeService } from "../services/challengeService.js";
import { chatService } from "../services/chatService.js";
import { coopSessionService } from "../services/coopSessionService.js";

const formatTime = (date) => new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const dayKey = (date) => new Date(date).toDateString();
const dayLabel = (date) => {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (value.toDateString() === today.toDateString()) return "Today";
  if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
  return value.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

const headerButton =
  "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-sm font-bold text-zinc-200 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50 sm:px-4";

const ChatThreadPage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [sendingChallenge, setSendingChallenge] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async (conversationId) => {
    const data = await chatService.getMessages(conversationId);
    setMessages(data.messages || []);
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await chatService.getConversationWithFriend(username);
        if (!active) return;
        setConversation(data.conversation);
        await loadMessages(data.conversation._id);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [username]);

  useEffect(() => {
    if (!conversation?._id) return undefined;
    const interval = setInterval(() => {
      loadMessages(conversation._id).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [conversation?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !conversation) return;
    setSending(true);
    setError("");
    try {
      await chatService.sendMessage(conversation._id, body);
      setText("");
      await loadMessages(conversation._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const sendChallenge = async ({ metric, durationDays }) => {
    setSendingChallenge(true);
    setError("");
    try {
      await challengeService.createChallenge({ friendUserId: conversation.otherUser._id, metric, durationDays });
      setChallengeModalOpen(false);
      await loadMessages(conversation._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingChallenge(false);
    }
  };

  const sendWorkoutInvite = async () => {
    setSendingInvite(true);
    setError("");
    try {
      await coopSessionService.createSession({ friendUserId: conversation.otherUser._id, title: `Workout with ${conversation.otherUser.name}` });
      await loadMessages(conversation._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div aria-busy="true" className="mx-auto h-[60vh] max-w-3xl animate-pulse rounded-3xl bg-white/[0.03]" />
      </Layout>
    );
  }

  if (error && !conversation) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl">
          <ErrorState message={error} />
          <Link className="text-sm font-semibold text-orange-300" to="/chat">
            Back to messages
          </Link>
        </div>
      </Layout>
    );
  }

  if (!conversation) return null;
  const other = conversation.otherUser;

  return (
    <Layout>
      <NewChallengeModal open={challengeModalOpen} opponentName={other.name} submitting={sendingChallenge} onClose={() => setChallengeModalOpen(false)} onSubmit={sendChallenge} />

      <div className="mx-auto flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b0d10] lg:h-[calc(100dvh-8rem)]">
        <header className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] p-3">
          <Link aria-label="Back to messages" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07]" to="/chat">
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link className="flex min-w-0 flex-1 items-center gap-2.5" to={`/u/${other.username}`}>
            <Avatar name={other.name} rank={other.currentOverallRank} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-white hover:underline">{other.name}</span>
              <span className="block truncate text-xs text-zinc-500">
                @{other.username}
                {other.currentOverallRank ? ` · ${other.currentOverallRank}` : ""}
              </span>
            </span>
          </Link>
          <button aria-label="Send a challenge" className={headerButton} type="button" onClick={() => setChallengeModalOpen(true)}>
            <ChallengeIcon className="h-4 w-4 text-orange-300" />
            <span className="hidden sm:inline">Challenge</span>
          </button>
          {conversation.canMessage !== false ? (
            <button aria-label="Invite to train together" className={headerButton} disabled={sendingInvite} type="button" onClick={sendWorkoutInvite}>
              <DumbbellIcon className="h-4 w-4 text-sky-300" />
              <span className="hidden sm:inline">Train together</span>
            </button>
          ) : null}
        </header>

        {error ? (
          <p className="shrink-0 bg-red-500/10 px-4 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <div aria-label={`Conversation with ${other.name}`} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5" role="log">
          {!messages.length ? <p className="mt-10 text-center text-sm text-zinc-500">No messages yet. Say hello, or send a challenge.</p> : null}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const isMine = message.senderId?._id === user?._id;
            const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
            const sameAsNext = next && next.type === "text" && message.type === "text" && next.senderId?._id === message.senderId?._id && new Date(next.createdAt) - new Date(message.createdAt) < 5 * 60000 && dayKey(next.createdAt) === dayKey(message.createdAt);
            const divider = newDay ? (
              <div className="my-4 flex items-center gap-3 text-xs font-semibold text-zinc-500">
                <span className="h-px flex-1 bg-white/[0.06]" />
                {dayLabel(message.createdAt)}
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>
            ) : null;

            let body;
            if (message.type === "system") {
              body = <p className="my-2 text-center text-xs text-zinc-500">{message.text}</p>;
            } else if (message.type === "challenge" && message.challengeId) {
              body = (
                <div className={`my-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <ChallengeMessageCard challenge={message.challengeId} onChanged={() => loadMessages(conversation._id)} />
                </div>
              );
            } else if (message.type === "workout_session" && message.coopSessionId) {
              body = (
                <div className={`my-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <CoopSessionMessageCard session={message.coopSessionId} onChanged={() => loadMessages(conversation._id)} />
                </div>
              );
            } else {
              body = (
                <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${sameAsNext ? "mb-0.5" : "mb-2.5"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 text-[0.95rem] leading-6 sm:max-w-[70%] ${
                      isMine ? "rounded-2xl rounded-br-md bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "rounded-2xl rounded-bl-md bg-white/[0.08] text-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    {!sameAsNext ? <p className={`mt-0.5 text-right text-[0.7rem] ${isMine ? "text-[#160a02]/60" : "text-zinc-500"}`}>{formatTime(message.createdAt)}</p> : null}
                  </div>
                </div>
              );
            }
            return (
              <Fragment key={message._id}>
                {divider}
                {body}
              </Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {conversation.canMessage === false ? (
          <p className="shrink-0 border-t border-white/[0.06] p-4 text-center text-sm text-zinc-400">
            Your challenges with @{other.username} show here. To chat,{" "}
            <Link className="font-semibold text-orange-300 hover:text-orange-200" to={`/u/${other.username}`}>
              add each other as friends
            </Link>
            .
          </p>
        ) : (
          <form className="flex shrink-0 items-end gap-2 border-t border-white/[0.06] p-3" onSubmit={handleSend}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Message {other.name}</span>
              <input
                className="min-h-12 w-full rounded-full border border-white/10 bg-white/[0.05] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-forge-ember/60"
                enterKeyHint="send"
                maxLength={2000}
                placeholder="Message"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
            <button
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
              disabled={!text.trim() || sending}
              type="submit"
            >
              <Send aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ChatThreadPage;
