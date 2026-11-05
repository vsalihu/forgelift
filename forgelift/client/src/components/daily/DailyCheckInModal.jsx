import { useState } from "react";
import CheckInForm from "./CheckInForm.jsx";
import DailyModalShell from "./DailyModalShell.jsx";
import { greeting } from "../../utils/dailyUtils.js";

export const checkInDefaults = (data) => {
  const checkIn = data?.log?.checkIn || {};
  const said = checkIn.trainingToday;
  return {
    sleepHours: checkIn.sleepHours ?? 7.5,
    trainingToday: said === true || said === false ? said : ["logged", "planned"].includes(data?.plan?.trainingSource) ? true : data?.plan?.trainingSource === "rest" ? false : null,
    energy: checkIn.energy ?? null,
    morningWeight: checkIn.morningWeight ?? ""
  };
};

export const checkInBody = (values) => ({
  checkIn: {
    sleepHours: values.sleepHours,
    energy: values.energy,
    trainingToday: values.trainingToday,
    morningWeight: values.morningWeight === "" ? undefined : Number(values.morningWeight)
  }
});

// The once-a-day check-in. Saving, skipping or closing all count as "done for today".
const DailyCheckInModal = ({ data, name, imperial, onSave, onSkip, onStopAsking, editing = false }) => {
  const [values, setValues] = useState(() => checkInDefaults(data));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(checkInBody(values));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <DailyModalShell
      closeLabel={editing ? "Close check-in" : "Skip today's check-in"}
      footer={
        <div className="space-y-2">
          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button
              className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={onSkip}
            >
              {editing ? "Cancel" : "Skip today"}
            </button>
            <button
              className="min-h-12 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_40px_-14px_rgba(249,115,22,0.95)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] disabled:opacity-60"
              disabled={saving}
              type="button"
              onClick={save}
            >
              {saving ? "Building your day…" : editing ? "Update my day" : "Build my day"}
            </button>
          </div>
          {onStopAsking ? (
            <button className="mx-auto block min-h-10 px-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onStopAsking}>
              Don't ask after I log in. I'll check in from Today.
            </button>
          ) : null}
        </div>
      }
      header={
        <header className="mb-6 pr-10">
          <p className="text-sm font-semibold text-orange-300">{editing ? "Check-in" : `${greeting()}${name ? `, ${name}` : ""}`}</p>
          <h2 className="font-display mt-1 text-2xl leading-tight text-white" id="checkin-title">
            {editing ? "Update today" : "How are you today?"}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">Ten seconds, and your to-dos fit the day you're actually having.</p>
        </header>
      }
      labelledBy="checkin-title"
      onClose={onSkip}
    >
      <CheckInForm detected={data?.plan?.trainingSource} values={values} weightUnit={imperial ? "lb" : "kg"} onChange={setValues} />
    </DailyModalShell>
  );
};

export default DailyCheckInModal;
