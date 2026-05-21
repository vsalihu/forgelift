const labels = {
  workout_frequency: "Workout Frequency",
  muscle_focus: "Muscle Focus",
  overload_target: "Overload Target",
  recovery_discipline: "Recovery Discipline",
  deload_compliance: "Deload Compliance",
  weak_point_fix: "Weak Point Fix",
  training_balance: "Training Balance",
  pr_challenge: "PR Challenge",
  consistency: "Consistency",
  goal_path: "Goal Path"
};

const MissionTypeBadge = ({ type }) => (
  <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-xs font-bold text-orange-200">
    {labels[type] || type?.replaceAll("_", " ") || "Mission"}
  </span>
);

export default MissionTypeBadge;
