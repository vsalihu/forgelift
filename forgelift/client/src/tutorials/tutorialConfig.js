export const tutorialConfig = {
  dashboard: [
    {
      target: "dashboard-hero",
      title: "Training command centre",
      content: "This is your daily overview for rank, recovery, missions, and what to train next.",
      placement: "bottom"
    },
    {
      target: "dashboard-start-gym-mode",
      title: "Start Gym Mode",
      content: "Use Gym Mode when you are training live. It gives you quick set logging, a rest timer, and workout analysis.",
      placement: "bottom"
    },
    {
      target: "dashboard-recovery",
      title: "Recovery",
      content: "Recovery shows what is safe to train. ForgeLift avoids confident claims when it does not have enough data.",
      placement: "top"
    },
    {
      target: "dashboard-overload",
      title: "Smart Overload",
      content: "Smart Overload shows what to do next for exercises with enough real history or a conservative baseline.",
      placement: "top"
    },
    {
      target: "dashboard-missions",
      title: "Missions",
      content: "Missions turn your goal path and training data into weekly actions.",
      placement: "top"
    },
    {
      target: "dashboard-data-readiness",
      title: "Data Readiness",
      content: "Data Readiness tells you what ForgeLift still needs before stronger recommendations unlock.",
      placement: "top"
    }
  ],
  workout_logger: [
    {
      target: "logger-workout-details",
      title: "Workout details",
      content: "Start with the workout name and optional session notes, then add exercises below.",
      placement: "bottom"
    },
    {
      target: "logger-add-exercise",
      title: "Add exercise",
      content: "Open the exercise picker to search, filter by muscle, or create a custom exercise.",
      placement: "bottom"
    },
    {
      target: "logger-set-entry",
      title: "Set entry",
      content: "Log weight, reps, optional RPE, and bodyweight settings. Add Set unlocks only when required values are present.",
      placement: "top"
    },
    {
      target: "logger-save-workout",
      title: "Save workout",
      content: "Saving runs workout analysis, PR detection, recovery, overload, missions, and progress updates.",
      placement: "top"
    }
  ],
  gym_mode: [
    {
      target: "gym-add-exercise",
      title: "Add exercises",
      content: "Add exercises to build your live workout. You can search, filter by muscle, or create custom exercises.",
      placement: "top"
    },
    {
      target: "gym-exercise-list",
      title: "Exercise list",
      content: "Your exercise list stays visible so you can jump between movements without losing context.",
      placement: "bottom"
    },
    {
      target: "gym-active-exercise",
      title: "Current exercise",
      content: "Use the expanded panel to log weight, reps, bodyweight settings, and optional RPE.",
      placement: "top",
      fallbackContent: "Add an exercise first, then the current exercise panel will appear."
    },
    {
      target: "gym-add-set",
      title: "Add Set",
      content: "Add Set unlocks when your set has valid data. The next set copies your last values for faster logging.",
      placement: "top",
      fallbackContent: "Add an exercise first to see the Add Set button."
    },
    {
      target: "gym-repeat-set",
      title: "Repeat Last Set",
      content: "Repeat Last Set immediately copies the previous saved set.",
      placement: "top",
      fallbackContent: "Add an exercise and log a set first to use Repeat Last Set."
    },
    {
      target: "gym-rest-timer",
      title: "Rest timer",
      content: "Use the rest timer between working sets without leaving Gym Mode.",
      placement: "top"
    },
    {
      target: "gym-finish-workout",
      title: "Finish Workout",
      content: "Finish saves the workout and shows your analysis, PRs, recovery impact, overload, and missions.",
      placement: "top",
      fallbackContent: "Finish Workout stays disabled until you log at least one valid set."
    },
    {
      target: "gym-reset-workout",
      title: "Reset Workout",
      content: "Reset clears only the current unsaved Gym Mode draft. Saved workouts are not affected.",
      placement: "bottom"
    }
  ],
  exercise_library: [
    {
      target: "exercise-search",
      title: "Search exercises",
      content: "Search by exercise name, equipment, or muscle terms like Quads and Brachialis.",
      placement: "bottom"
    },
    {
      target: "exercise-filter-chips",
      title: "Muscle filters",
      content: "Use broad filters first, then open advanced filters for detailed muscle anatomy.",
      placement: "bottom"
    },
    {
      target: "exercise-card",
      title: "Impact bars",
      content: "Impact bars show how much an exercise targets primary, secondary, and stabiliser muscles.",
      placement: "top"
    },
    {
      target: "exercise-create-custom",
      title: "Create custom exercises",
      content: "If ForgeLift does not list your movement, create a private custom exercise with your own muscle targets.",
      placement: "bottom"
    }
  ],
  strength_baselines: [
    {
      target: "baseline-search",
      title: "Find a lift",
      content: "Use search and muscle filters instead of scrolling a long exercise list.",
      placement: "bottom"
    },
    {
      target: "baseline-popular-lifts",
      title: "Popular baseline lifts",
      content: "Start with common lifts like Bench Press, Squat, Deadlift, Overhead Press, Rows, Pull-Ups, Hip Thrust, or RDL.",
      placement: "bottom"
    },
    {
      target: "baseline-add-form",
      title: "Enter known strength",
      content: "Enter a weight and reps. ForgeLift estimates your 1RM and related starting weights.",
      placement: "left"
    },
    {
      target: "baseline-estimates",
      title: "Related estimates",
      content: "Estimated lifts are starting points only. Real workout history always overrides estimates.",
      placement: "top"
    }
  ],
  assessment: [
    {
      target: "assessment-overview",
      title: "ForgeLift Assessment",
      content: "The assessment estimates your starting level, goal path, and optional strength baselines.",
      placement: "bottom"
    },
    {
      target: "assessment-progress",
      title: "Step progress",
      content: "Move through the short questionnaire at your own pace. You can skip and return later from Profile.",
      placement: "bottom"
    }
  ],
  missions: [
    {
      target: "missions-weekly-target",
      title: "Weekly target",
      content: "This shows the training target ForgeLift wants you to work toward this week.",
      placement: "bottom"
    },
    {
      target: "missions-active-list",
      title: "Active missions",
      content: "Missions are weekly actions based on your training data, weak points, recovery, and goal path.",
      placement: "top"
    },
    {
      target: "mission-card",
      title: "Mission cards",
      content: "Tap a mission to see why it was created, progress breakdown, target muscles, and next action.",
      placement: "top"
    }
  ],
  recovery: [
    {
      target: "recovery-summary",
      title: "Recovery summary",
      content: "Recovery shows what is safe to train, but today’s recommendation also checks training balance.",
      placement: "bottom"
    },
    {
      target: "recovery-ready-groups",
      title: "Ready groups",
      content: "Muscles with enough real data and good recovery appear as ready to train.",
      placement: "top"
    },
    {
      target: "recovery-avoid-groups",
      title: "Avoid heavy work",
      content: "ForgeLift only warns you to avoid a muscle when it has evidence from recent training load.",
      placement: "top"
    }
  ],
  profile: [
    {
      target: "profile-basic-info",
      title: "Profile basics",
      content: "Keep bodyweight, units, goal path, and overload mode updated so recommendations stay accurate.",
      placement: "bottom"
    },
    {
      target: "profile-assessment",
      title: "Assessment",
      content: "Retake your ForgeLift Assessment any time to refresh your estimated level and baselines.",
      placement: "top"
    },
    {
      target: "profile-bodyweight",
      title: "Bodyweight",
      content: "Weekly bodyweight entries keep strength ratios and bodyweight exercise logging accurate.",
      placement: "top"
    },
    {
      target: "profile-data-management",
      title: "Data management",
      content: "Reset training data safely without deleting your account or profile.",
      placement: "top"
    }
  ],
  weak_points: [
    {
      target: "weak-points-overview",
      title: "Weak points",
      content: "Weak points appear only when ForgeLift has enough comparable training data.",
      placement: "bottom"
    }
  ],
  training_balance: [
    {
      target: "training-balance-overview",
      title: "Training balance",
      content: "Training balance checks push/pull, upper/lower, front/rear, and direct/indirect work.",
      placement: "bottom"
    }
  ],
  ranks: [
    {
      target: "ranks-overview",
      title: "Ranks and XP",
      content: "Ranks turn real workout history into progress levels. Untrained muscles stay unassessed until you log data.",
      placement: "bottom"
    }
  ],
  analytics: [
    {
      target: "analytics-overview",
      title: "Advanced analytics",
      content: "Analytics use your workout history to show volume, strength trends, muscle load, PRs, recovery, and missions.",
      placement: "bottom"
    }
  ],
  monthly_reports: [
    {
      target: "monthly-reports-overview",
      title: "Monthly reports",
      content: "Monthly reports summarize real training data from the selected month and avoid fake insights when data is missing.",
      placement: "bottom"
    }
  ],
  data_management: [
    {
      target: "data-summary",
      title: "Data summary",
      content: "Review how much training data ForgeLift has before deleting anything.",
      placement: "bottom"
    },
    {
      target: "delete-date-range",
      title: "Delete by date range",
      content: "Delete only a selected period, then ForgeLift recalculates derived training state.",
      placement: "top"
    },
    {
      target: "reset-training-data",
      title: "Reset training data",
      content: "This clears training progress while keeping your account and profile.",
      placement: "top"
    }
  ],
  smart_overload: [
    {
      target: "overload-recommendations",
      title: "Recommendations",
      content: "Smart Overload tells you what to do next when ForgeLift has enough exercise history.",
      placement: "bottom"
    },
    {
      target: "overload-card",
      title: "Recommendation card",
      content: "Each card separates real recommendations from conservative starting estimates.",
      placement: "top"
    }
  ],
  deload: [
    {
      target: "deload-active",
      title: "Deload status",
      content: "Deload warnings appear only when ForgeLift has enough fatigue or plateau evidence.",
      placement: "bottom"
    },
    {
      target: "deload-plateaus",
      title: "Plateau monitoring",
      content: "Plateaus require multiple real sessions before ForgeLift makes a claim.",
      placement: "top"
    }
  ]
};

export const getTutorialSteps = (pageKey) => tutorialConfig[pageKey] || [];
