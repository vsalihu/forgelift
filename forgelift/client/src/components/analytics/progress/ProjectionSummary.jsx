import StatTile from "../StatTile.jsx";
import { describeEta, formatSigned } from "./format.js";
import { FlameIcon, GoalIcon, TrendingUpIcon } from "../../icons/featureIcons.jsx";
import { RanksIcon } from "../../icons/navIcons.jsx";

const ProjectionSummary = ({ progress, selectedLift }) => {
  const { rankJourney, lifts = [], consistency, unit } = progress;
  const current = rankJourney?.current;
  const goals = lifts.filter((lift) => lift.goal);
  const onPace = goals.filter((lift) => ["on_pace", "reached"].includes(lift.goal.eta.status)).length;
  const streak = consistency?.currentStreakWeeks || 0;
  const gain = selectedLift?.projection?.weeklyGain;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={RanksIcon}
        label={current?.nextRank ? `Next: ${current.nextRank}` : "Rank"}
        sub={current?.nextRank ? describeEta(rankJourney.nextRankEta, { ceilingLabel: " pts" }) : "You're at the top rank."}
        tone="accent"
        value={current?.rank || "Copper"}
      />
      <StatTile
        icon={TrendingUpIcon}
        label={selectedLift ? `${selectedLift.exerciseName} trend` : "Strength trend"}
        sub={selectedLift?.projection ? "Change in estimated max per week" : "Log a lift 3+ times over 3 weeks"}
        tone={gain > 0 ? "good" : "neutral"}
        value={selectedLift?.projection ? `${formatSigned(gain, ` ${unit}`)}/wk` : "–"}
      />
      <StatTile
        icon={GoalIcon}
        label="Goals"
        sub={goals.length ? `${onPace} of ${goals.length} on pace` : "Set one on the strength chart"}
        tone={goals.length && onPace === goals.length ? "good" : goals.length ? "warn" : "neutral"}
        value={goals.length || "None"}
      />
      <StatTile
        icon={FlameIcon}
        label="Weekly streak"
        sub="Weeks in a row with a workout"
        tone={streak >= 4 ? "good" : "neutral"}
        value={`${streak} wk${streak === 1 ? "" : "s"}`}
      />
    </div>
  );
};

export default ProjectionSummary;
