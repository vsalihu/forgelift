import { useState } from "react";
import { safetyService } from "../../services/safetyService.js";
import Button from "../Button.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import { BlockIcon, ReportIcon } from "../icons/featureIcons.jsx";

const REASONS = [
  { value: "fake_lifts", label: "Fake or impossible lifts" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate_profile", label: "Inappropriate name or profile" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" }
];

const SafetyActions = ({ username, isBlocked, onBlockedChange }) => {
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("fake_lifts");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const block = async () => {
    setBusy(true);
    try {
      await safetyService.block(username);
      setConfirmBlock(false);
      onBlockedChange(true);
    } finally {
      setBusy(false);
    }
  };

  const unblock = async () => {
    setBusy(true);
    try {
      await safetyService.unblock(username);
      onBlockedChange(false);
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await safetyService.report(username, reason, details);
      setReportOpen(false);
      setDetails("");
      setMessage("Thanks. Your report was sent.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {confirmBlock ? (
        <ConfirmModal
          confirmLabel="Block"
          description={`@${username} won't be able to message, challenge or friend you, any friendship between you ends, and you won't see each other on leaderboards.`}
          loading={busy}
          title={`Block @${username}?`}
          onCancel={() => setConfirmBlock(false)}
          onConfirm={block}
        />
      ) : null}

      <BottomSheet open={reportOpen} title={`Report @${username}`} onClose={() => setReportOpen(false)}>
        <form className="space-y-4" onSubmit={submitReport}>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-zinc-200">What's wrong?</legend>
            {REASONS.map((option) => (
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-200" key={option.value}>
                <input
                  checked={reason === option.value}
                  className="accent-orange-500"
                  name="report-reason"
                  type="radio"
                  value={option.value}
                  onChange={() => setReason(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-200">Details (optional)</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none focus:border-forge-ember"
              maxLength={1000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </label>
          <Button className="w-full" loading={busy} type="submit">
            Send report
          </Button>
        </form>
      </BottomSheet>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {isBlocked ? (
          <button className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-forge-ember hover:text-orange-300" disabled={busy} type="button" onClick={unblock}>
            <BlockIcon className="h-4 w-4" />
            Unblock
          </button>
        ) : (
          <button className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-zinc-400 hover:text-white" type="button" onClick={() => setConfirmBlock(true)}>
            <BlockIcon className="h-4 w-4" />
            Block
          </button>
        )}
        <button className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-zinc-400 hover:text-white" type="button" onClick={() => setReportOpen(true)}>
          <ReportIcon className="h-4 w-4" />
          Report
        </button>
        {message ? <span className="text-xs text-zinc-400">{message}</span> : null}
      </div>
    </>
  );
};

export default SafetyActions;
