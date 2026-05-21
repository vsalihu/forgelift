export const priorityRewards = {
  Low: 50,
  Medium: 100,
  High: 150,
  Critical: 250
};

export const getMissionTemplatesForGoalPath = (goalPath = "") => {
  const templates = {
    "Strength Warrior": [
      "Complete 3 strength sessions this week",
      "Hit one overload recommendation",
      "Train a major compound lift twice",
      "Avoid maxing out if a deload is active"
    ],
    "Muscle Builder": [
      "Hit weekly volume target",
      "Train a weak muscle directly twice",
      "Add one extra controlled set for target muscle",
      "Avoid neglecting rear chain"
    ],
    "Fat Loss Fighter": [
      "Complete 3 to 5 workouts this week",
      "Complete one conditioning or core session",
      "Maintain consistency streak",
      "Keep intensity moderate if recovery is low"
    ],
    "Athletic Performance": [
      "Balance push and pull work",
      "Train core directly",
      "Include lower-body and rear-chain work",
      "Avoid repeated high fatigue"
    ],
    "Beginner Foundation": [
      "Complete 2 to 3 workouts",
      "Practice consistent logging",
      "Avoid RPE 10 sessions",
      "Complete direct work for weak areas"
    ],
    "Balanced Beast": [
      "Fix biggest imbalance",
      "Train all major muscle groups this week",
      "Keep push/pull ratio closer to balanced",
      "Complete one lower-body and one pull session"
    ],
    "Glute Growth": [
      "Complete 2 glute or lower sessions this week",
      "Hit direct glute volume target",
      "Progress hip thrust, RDL, squat, or leg press",
      "Avoid overtraining glutes if recovery is poor"
    ]
  };

  return templates[goalPath] || templates["Balanced Beast"];
};

export const getMissionReward = (priority = "Medium") => priorityRewards[priority] || priorityRewards.Medium;
