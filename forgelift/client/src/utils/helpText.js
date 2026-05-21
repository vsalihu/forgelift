export const helpText = {
  rpe: {
    title: "RPE",
    content: "RPE means Rate of Perceived Exertion. It is a 1 to 10 score for how hard a set felt.",
    example:
      "RPE 6 means easy, around 4 reps left. RPE 8 means hard but controlled, around 2 reps left. RPE 10 means maximum effort."
  },
  estimated1RM: {
    title: "Estimated 1RM",
    content:
      "Estimated 1RM is ForgeLift's estimate of the maximum weight you could lift for one rep, based on the weight and reps you logged.",
    example: "If you bench 100kg for 8 reps, your estimated 1RM may be around 126kg."
  },
  volume: {
    title: "Volume",
    content: "Volume is the total amount of work completed.",
    example: "80kg x 10 reps x 3 sets = 2,400kg volume."
  },
  overload: {
    title: "Progressive Overload",
    content:
      "Progressive overload means gradually making training harder over time by adding weight, reps, sets, or better control.",
    example:
      "If you bench 80kg for 10,10,9 this week, ForgeLift may ask you to reach 10,10,10 before increasing weight."
  },
  deload: {
    title: "Deload",
    content: "A deload is a short easier training period used to recover from fatigue or break a plateau.",
    example:
      "ForgeLift may suggest reducing weight by 10% for one session if your lift has stalled and RPE is high."
  },
  plateau: {
    title: "Plateau",
    content: "A plateau means your progress has stalled for several sessions.",
    example: "If your bench press has not improved for 4 sessions, ForgeLift may detect a plateau."
  },
  recoveryReadiness: {
    title: "Recovery Readiness",
    content: "Recovery readiness estimates how ready a muscle is to train again.",
    example: "If chest recovery is 45%, ForgeLift may suggest waiting before heavy pressing."
  },
  directLoad: {
    title: "Direct Load",
    content: "Direct load means the muscle was the main target of the exercise.",
    example: "Bench Press directly loads chest."
  },
  indirectLoad: {
    title: "Indirect Load",
    content: "Indirect load means the muscle helped during the exercise but was not the main target.",
    example: "Bench Press indirectly loads front shoulders and triceps."
  },
  stabiliserLoad: {
    title: "Stabiliser Load",
    content: "Stabiliser load means the muscle helped support the movement.",
    example: "Your core can work as a stabiliser during squats or overhead press."
  },
  trainingBalance: {
    title: "Training Balance",
    content: "Training balance checks whether your training is evenly developed.",
    example: "If you train chest much more than back, ForgeLift may warn about push/pull imbalance."
  },
  weakPoint: {
    title: "Weak Point",
    content: "A weak point is a muscle group or exercise area that is falling behind your stronger areas.",
    example: "If shoulders are 2 ranks behind chest, ForgeLift may suggest direct shoulder work."
  },
  smartOverload: {
    title: "Smart Overload",
    content: "Smart Overload recommends what to do next time for an exercise.",
    example: "It may tell you to increase weight, repeat the same weight, add reps, or reduce weight."
  },
  strengthBaseline: {
    title: "Strength Baseline",
    content:
      "A strength baseline is a lift number you enter manually so ForgeLift can estimate starting weights for related exercises.",
    example:
      "If you enter a 120kg bench press, ForgeLift can estimate starting points for incline press and close-grip bench."
  },
  confidence: {
    title: "Confidence",
    content: "Confidence shows how reliable ForgeLift thinks a recommendation is.",
    example:
      "High confidence usually means ForgeLift has enough workout history. Low confidence means it is using limited data."
  },
  rank: {
    title: "Rank",
    content:
      "Ranks turn your training progress into levels based on strength, volume, consistency, and personal records.",
    example: "Your chest might be Gold while your shoulders are Silver."
  },
  xp: {
    title: "XP",
    content:
      "XP is earned from workouts, personal records, missions, and progress. It supports your overall ForgeLift progression.",
    example: "Completing a workout may earn XP."
  },
  mission: {
    title: "Mission",
    content:
      "Missions are weekly training goals based on your current progress, weak points, recovery, and goal path.",
    example: "ForgeLift may give you a mission to train back twice this week."
  },
  assessmentLevel: {
    title: "Assessment Level",
    content:
      "Assessment level is ForgeLift's starting estimate of your training experience based on your background and optional lift numbers.",
    example: "If you enter several strong baseline lifts and train consistently, ForgeLift may classify you as Intermediate or Advanced."
  },
  restTimer: {
    title: "Rest Timer",
    content: "The rest timer helps you keep rest periods consistent between sets.",
    example: "Use 90 to 180 seconds for many strength sets, then adjust based on your goal and recovery."
  },
  soreness: {
    title: "Soreness",
    content: "Soreness is how beat up your body feels from previous training.",
    example: "A high soreness score can make ForgeLift more conservative with recovery and overload advice."
  },
  sleepQuality: {
    title: "Sleep Quality",
    content: "Sleep quality helps ForgeLift judge recovery. Better sleep usually means better readiness.",
    example: "If sleep quality is low, ForgeLift may warn against pushing heavy loads."
  },
  energyLevel: {
    title: "Energy Level",
    content: "Energy level is how ready and alert you feel before or after a session.",
    example: "Low energy can reduce recovery readiness and make overload suggestions more conservative."
  },
  completedSet: {
    title: "Completed Set",
    content: "Mark a set completed if you finished the planned reps with usable form.",
    example: "If you failed the rep target or stopped early, uncheck completed."
  },
  strengthTrend: {
    title: "Strength Trend",
    content: "Strength trend shows how your estimated 1RM changes across workouts.",
    example: "If your squat estimated 1RM rises over several weeks, your strength trend is improving."
  },
  muscleLoadDistribution: {
    title: "Muscle Load Distribution",
    content: "This shows which muscles received the most training load.",
    example: "A chest-heavy month may show much more Chest load than Back load."
  },
  monthlyReport: {
    title: "Monthly Report",
    content: "Monthly Reports summarize your training, PRs, missions, recovery, and focus areas.",
    example: "Use it to see what improved this month and what to focus on next month."
  }
};
