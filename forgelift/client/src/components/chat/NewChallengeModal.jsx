import { useState } from "react";
import Button from "../Button.jsx";
import FormInput from "../FormInput.jsx";
import SelectInput from "../SelectInput.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";

const metricOptions = [
  { value: "volume", label: "Most volume (kg)" },
  { value: "workout_count", label: "Most workouts logged" }
];

const NewChallengeModal = ({ open, opponentName, submitting, onClose, onSubmit }) => {
  const [metric, setMetric] = useState("volume");
  const [durationDays, setDurationDays] = useState("7");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ metric, durationDays: Number(durationDays) });
  };

  return (
    <BottomSheet open={open} title={`Challenge ${opponentName || "friend"}`} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <SelectInput label="What counts" options={metricOptions} value={metric} onChange={(event) => setMetric(event.target.value)} />
        <FormInput
          label="Duration (days)"
          max="90"
          min="1"
          type="number"
          value={durationDays}
          onChange={(event) => setDurationDays(event.target.value)}
        />
        <Button className="w-full" loading={submitting} type="submit">
          Send Challenge
        </Button>
      </form>
    </BottomSheet>
  );
};

export default NewChallengeModal;
