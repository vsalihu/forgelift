export const calculateXP = ({ workout, newPersonalRecords = [] }) => {
  const completedSetCount = workout.completedSetCount || 0;
  let xpEarned = 50;

  xpEarned += completedSetCount * 5;
  xpEarned += newPersonalRecords.length * 100;

  if ((workout.totalVolume || 0) >= 5000) {
    xpEarned += 50;
  }

  return xpEarned;
};
