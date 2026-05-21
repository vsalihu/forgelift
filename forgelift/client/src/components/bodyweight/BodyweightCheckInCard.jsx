import { useState } from "react";
import { Scale } from "lucide-react";
import Button from "../Button.jsx";
import FormInput from "../FormInput.jsx";

const BodyweightCheckInCard = ({ currentBodyweight, due = true, unit = "kg", onSave }) => {
  const [weight, setWeight] = useState(currentBodyweight || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ weight, unit });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`rounded-xl border p-5 ${due ? "border-forge-copper/30 bg-forge-copper/10" : "border-white/10 bg-black/20"}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-lg bg-white/10 p-2 text-forge-ember">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-black text-white">Weekly bodyweight check-in</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Update your bodyweight so ForgeLift keeps strength ratios and bodyweight exercises accurate.
          </p>
        </div>
      </div>
      <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <FormInput label={`Bodyweight (${unit})`} min="1" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} />
        <Button className="self-end" disabled={!weight || Number(weight) <= 0} loading={saving} type="submit">
          Save Bodyweight
        </Button>
      </form>
    </section>
  );
};

export default BodyweightCheckInCard;
