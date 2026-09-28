const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const possessive = (name) => `${name}${name.endsWith("s") ? "'" : "'s"}`;

const getACWRStatus = (acwr) => {
  if (acwr === null) return "No Data";
  if (acwr < 0.8) return "Undertraining";
  if (acwr <= 1.3) return "Sweet Spot";
  if (acwr <= 1.5) return "Caution";
  return "High Risk";
};

const getStrengthDirection = (percentChange) => {
  if (percentChange === null) return "No Data";
  if (percentChange >= 2) return "Rising";
  if (percentChange <= -2) return "Declining";
  return "Stable";
};

const getQuadrant = ({ acwrStatus, strengthDirection }) => {
  if (acwrStatus === "No Data" || strengthDirection === "No Data") return "Not Enough Data";

  if (strengthDirection === "Rising") {
    return acwrStatus === "High Risk" ? "Overreaching" : "Real Progress";
  }

  if (strengthDirection === "Declining") {
    return acwrStatus === "Undertraining" ? "Detraining" : "Fatigued Without Gains";
  }

  if (acwrStatus === "High Risk" || acwrStatus === "Caution") return "Fatigued Without Gains";
  if (acwrStatus === "Undertraining") return "Detraining";
  return "Maintaining";
};

const quadrantSummary = {
  "Real Progress": (muscle) => `${muscle} is getting stronger at a sustainable training load. Keep going.`,
  Overreaching: (muscle) =>
    `${muscle} is getting stronger, but load has spiked hard recently. Real progress, real risk -- a lighter week soon would protect it.`,
  "Fatigued Without Gains": (muscle) =>
    `${muscle} is carrying a heavy load without strength to show for it yet. A deload would likely help before pushing further.`,
  Detraining: (muscle) => `${possessive(muscle)} training load has dropped off and strength isn't climbing. Add a session or two if this muscle matters to you.`,
  Maintaining: (muscle) => `${muscle} is holding steady: stable strength at a sustainable load.`,
  "Not Enough Data": (muscle) => `Not enough history yet to judge ${possessive(muscle)} training load trend.`
};

export const calculateTrainingLoadStatus = ({
  muscleGroup,
  acuteLoad = 0,
  chronicLoad = 0,
  chronicWindowDays = 0,
  strengthDataPoints = []
}) => {
  const hasLoadData = chronicLoad > 0 || acuteLoad > 0;
  const hasEnoughChronicHistory = chronicWindowDays >= 14 && chronicLoad > 0;

  // chronicLoad is a sum over chronicWindowDays, not a weekly figure -- convert
  // it to a weekly average before comparing it against the 7-day acute sum,
  // otherwise a perfectly steady training pattern reads as "Undertraining".
  let acwr = null;
  if (hasEnoughChronicHistory) {
    const chronicWeeklyAverage = chronicLoad / (chronicWindowDays / 7);
    acwr = chronicWeeklyAverage > 0 ? roundOne(acuteLoad / chronicWeeklyAverage) : null;
  } else if (chronicLoad === 0 && acuteLoad > 0) {
    acwr = 2;
  }
  const acwrStatus = hasLoadData ? getACWRStatus(acwr) : "No Data";

  const validStrengthPoints = strengthDataPoints.filter((point) => point.baseline > 0 && point.current > 0);
  let strengthTrendPercent = null;
  if (validStrengthPoints.length) {
    const totalChange = validStrengthPoints.reduce(
      (sum, point) => sum + (point.current - point.baseline) / point.baseline,
      0
    );
    strengthTrendPercent = roundOne((totalChange / validStrengthPoints.length) * 100);
  }
  const strengthDirection = getStrengthDirection(strengthTrendPercent);

  const quadrant = getQuadrant({ acwrStatus, strengthDirection });
  const confidence =
    quadrant === "Not Enough Data" ? "none" : validStrengthPoints.length >= 2 && hasEnoughChronicHistory ? "high" : "medium";

  return {
    muscleGroup,
    acuteLoad: roundOne(acuteLoad),
    chronicLoad: roundOne(chronicLoad),
    acwr,
    acwrStatus,
    strengthTrendPercent,
    strengthDirection,
    quadrant,
    confidence,
    dataAvailable: quadrant !== "Not Enough Data",
    summary: quadrantSummary[quadrant](muscleGroup)
  };
};
