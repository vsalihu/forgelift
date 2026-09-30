import { Flame, Target, TrendingUp, Trophy } from "lucide-react";
import IconMetricCard from "../../visuals/IconMetricCard.jsx";
import VisualSummaryGrid from "../../visuals/VisualSummaryGrid.jsx";
import { describeEta, formatSigned } from "./format.js";

const ProjectionSummary = ({ progress, selectedLift }) => {
  const { rankJourney, lifts = [], consistency, unit } = progress;
  const current = rankJourney?.current;
  const goals = lifts.filter((lift) => lift.goal);
  const onPace = goals.filter((lift) => ["on_pace", "reached"].includes(lift.goal.eta.status)).length;
  const streak = consistency?.currentStreakWeeks || 0;

  return (
    <VisualSummaryGrid>
      <IconMetricCard
        icon={Trophy}
        label={current?.nextRank ? `Next rank: ${current.nextRank}` : "Rank"}
        status={current?.nextRank ? describeEta(rankJourney.nextRankEta, { ceilingLabel: " pts" }) : "You're at the top rank"}
        value={current?.rank || "Copper"}
        variant="rank"
      />
      <IconMetricCard
        icon={TrendingUp}
        label={selectedLift ? `${selectedLift.exerciseName} trend` : "Strength trend"}
        status={selectedLift?.projection ? "Change in estimated max per week" : "Log a lift 3+ times over 3 weeks"}
        value={selectedLift?.projection ? `${formatSigned(selectedLift.projection.weeklyGain, ` ${unit}`)}/wk` : "-"}
        variant={selectedLift?.projection?.weeklyGain > 0 ? "success" : "neutral"}
      />
      <IconMetricCard
        icon={Target}
        label="Goals"
        status={goals.length ? `${onPace} of ${goals.length} on pace` : "Set a goal on the strength chart"}
        value={goals.length || "None"}
        variant={goals.length && onPace === goals.length ? "success" : goals.length ? "warning" : "neutral"}
      />
      <IconMetricCard
        icon={Flame}
        label="Weekly streak"
        status="Weeks in a row with a workout"
        value={`${streak} wk${streak === 1 ? "" : "s"}`}
        variant={streak >= 4 ? "success" : "neutral"}
      />
    </VisualSummaryGrid>
  );
};

export default ProjectionSummary;
