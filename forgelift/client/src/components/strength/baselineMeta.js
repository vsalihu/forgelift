export const formatWeight = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

// Same formula the server uses (Epley; a single rep is taken as-is).
export const estimateOneRepMax = (weight, reps) => {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 10) / 10;
};

export const SOURCE_LABELS = {
  user_entered: "You entered",
  workout_history: "From your workouts",
  estimated_from_baseline: "Estimated"
};

export const CONFIDENCE_TONES = {
  High: "bg-emerald-400/10 text-emerald-200",
  Medium: "bg-amber-400/10 text-amber-200",
  Low: "bg-white/[0.06] text-zinc-300"
};
