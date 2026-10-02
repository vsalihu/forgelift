import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../social/Avatar.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";

const SendToFriendSheet = ({ template, friends, sending, onClose, onSend }) => {
  const [friendId, setFriendId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFriendId("");
    setError("");
  }, [template?._id]);

  const send = async () => {
    setError("");
    try {
      await onSend(template, friendId);
    } catch (err) {
      setError(err.message || "Couldn't send it.");
    }
  };

  return (
    <BottomSheet open={Boolean(template)} title={template ? `Send "${template.name}"` : ""} onClose={onClose}>
      {friends.length ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">They'll get a copy in their Workouts inbox. Your version stays as it is.</p>
          <ul aria-label="Friends" className="max-h-[45vh] space-y-1.5 overflow-y-auto" role="radiogroup">
            {friends.map((friend) => {
              const active = friendId === friend._id;
              return (
                <li key={friend._id}>
                  <button
                    aria-checked={active}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      active ? "border-forge-ember/50 bg-forge-ember/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                    role="radio"
                    type="button"
                    onClick={() => setFriendId(friend._id)}
                  >
                    <Avatar name={friend.name} rank={friend.currentOverallRank} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-white">{friend.name}</span>
                      <span className="block truncate text-xs text-zinc-500">@{friend.username}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-transparent bg-forge-ember text-[#160a02]" : "border-white/20"}`}
                    >
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="min-h-12 w-full rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
            disabled={!friendId || sending}
            type="button"
            onClick={send}
          >
            {sending ? "Sending..." : "Send workout"}
          </button>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="font-display text-xl text-white">No friends to send to yet.</p>
          <p className="mt-1 text-sm text-zinc-400">Add someone first, then share your workouts with them.</p>
          <Link className="mt-4 inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09]" to="/friends">
            Find friends
          </Link>
        </div>
      )}
    </BottomSheet>
  );
};

export default SendToFriendSheet;
