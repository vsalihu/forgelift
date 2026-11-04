import { WeightPlateIcon } from "../components/icons/featureIcons.jsx";
import { DesignWorkoutIcon, HistoryIcon, OverloadIcon } from "../components/icons/navIcons.jsx";

// "What's new" notes, newest first. Signed-in users see the newest one once (tracked on their
// account), and accounts created on or after its date skip it. To announce an update, add an
// entry at the top with a new id (letters, digits, dots and dashes; the date works well).
export const RELEASES = [
  {
    id: "2026-11-04",
    date: "2026-11-04",
    title: "Smarter workouts, saves you can trust",
    intro: "A round of upgrades to how you plan, progress and log your training.",
    highlights: [
      {
        icon: DesignWorkoutIcon,
        title: "Muscle coverage in Design a Workout",
        body: "Pick the muscles you're training and watch a meter fill for every part, like the biceps long head or lower back. Tap one to see what trains it.",
        to: "/workout-templates",
        cta: "Design a workout"
      },
      {
        icon: OverloadIcon,
        title: "Smart Overload moves the weight up",
        body: "Hit your top reps and it tells you when and how much to add, and it follows your deloads.",
        to: "/overload",
        cta: "See your next lifts"
      },
      {
        icon: HistoryIcon,
        title: "Saving and deleting you can see",
        body: "Finishing or deleting a workout now shows its progress, tells you when the server is waking up, and can be retried without ever saving twice."
      },
      {
        icon: WeightPlateIcon,
        title: "Precise bodyweight",
        body: "Log your weight to the decimal, like 82.4 kg."
      }
    ]
  }
];

export const LATEST_RELEASE = RELEASES[0] || null;
