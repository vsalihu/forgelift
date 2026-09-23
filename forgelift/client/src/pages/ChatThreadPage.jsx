import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell, Send, Trophy } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import ChallengeMessageCard from "../components/chat/ChallengeMessageCard.jsx";
import CoopSessionMessageCard from "../components/chat/CoopSessionMessageCard.jsx";
import NewChallengeModal from "../components/chat/NewChallengeModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import RankBadge from "../components/ranks/RankBadge.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { chatService } from "../services/chatService.js";
import { challengeService } from "../services/challengeService.js";
import { coopSessionService } from "../services/coopSessionService.js";

const formatTime = (date) => new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

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
  const conversationIdRef = useRef(null);

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
        conversationIdRef.current = data.conversation._id;
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim() || !conversation) return;
    setSending(true);
    setError("");
    try {
      await chatService.sendMessage(conversation._id, text.trim());
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
      await coopSessionService.createSession({
        friendUserId: conversation.otherUser._id,
        title: `Workout with ${conversation.otherUser.name}`
      });
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
        <LoadingSkeleton rows={5} />
      </Layout>
    );
  }

  if (error && !conversation) {
    return (
      <Layout>
        <ErrorState message={error} />
      </Layout>
    );
  }

  if (!conversation) return null;

  return (
    <Layout>
      <NewChallengeModal
        open={challengeModalOpen}
        opponentName={conversation.otherUser.name}
        submitting={sendingChallenge}
        onClose={() => setChallengeModalOpen(false)}
        onSubmit={sendChallenge}
      />

      <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-forge-panel lg:h-[calc(100vh-7rem)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link className="shrink-0 rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden" to="/chat">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <Link className="font-black text-white hover:underline" to={`/u/${conversation.otherUser.username}`}>
                {conversation.otherUser.name}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <RankBadge rank={conversation.otherUser.currentOverallRank} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none" type="button" variant="secondary" onClick={() => setChallengeModalOpen(true)}>
              <Trophy className="h-4 w-4" />
              Challenge
            </Button>
            <Button className="flex-1 sm:flex-none" loading={sendingInvite} type="button" variant="secondary" onClick={sendWorkoutInvite}>
              <Dumbbell className="h-4 w-4" />
              Train Together
            </Button>
          </div>
        </div>

        {error ? <div className="shrink-0 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          {messages.map((message) => {
            const isMine = message.senderId?._id === user?._id;

            if (message.type === "system") {
              return (
                <p className="text-center text-xs text-slate-500" key={message._id}>
                  {message.text}
                </p>
              );
            }

            if (message.type === "challenge" && message.challengeId) {
              return (
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={message._id}>
                  <ChallengeMessageCard challenge={message.challengeId} onChanged={() => loadMessages(conversation._id)} />
                </div>
              );
            }

            if (message.type === "workout_session" && message.coopSessionId) {
              return (
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={message._id}>
                  <CoopSessionMessageCard session={message.coopSessionId} onChanged={() => loadMessages(conversation._id)} />
                </div>
              );
            }

            return (
              <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={message._id}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine ? "bg-forge-ember text-white" : "bg-white/10 text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p className={`mt-1 text-[11px] ${isMine ? "text-orange-100/80" : "text-slate-400"}`}>{formatTime(message.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="flex shrink-0 gap-2 border-t border-white/10 p-3" onSubmit={handleSend}>
          <input
            className="min-h-11 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none transition placeholder:text-slate-500 focus:border-forge-ember focus:ring-2 focus:ring-forge-ember/20"
            placeholder="Message"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <Button disabled={!text.trim()} loading={sending} type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default ChatThreadPage;
