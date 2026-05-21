import { RANKS } from "./rankConfig.js";

const getRankLevel = (rankName) => RANKS.find((rank) => rank.name === rankName)?.level || 0;

export const detectRankPromotions = ({ oldOverallRank, newOverallRank, oldMuscleRanks = {}, newMuscleRanks = [] }) => {
  const promotions = [];

  if (getRankLevel(newOverallRank) > getRankLevel(oldOverallRank)) {
    promotions.push({
      type: "overall",
      oldRank: oldOverallRank || "Copper",
      newRank: newOverallRank,
      message: `Overall Rank promoted from ${oldOverallRank || "Copper"} to ${newOverallRank}`
    });
  }

  newMuscleRanks.forEach((muscleRank) => {
    const oldRank = oldMuscleRanks[muscleRank.muscleGroup]?.rank || "Copper";

    if (getRankLevel(muscleRank.rank) > getRankLevel(oldRank)) {
      promotions.push({
        type: "muscle",
        muscleGroup: muscleRank.muscleGroup,
        oldRank,
        newRank: muscleRank.rank,
        message: `${muscleRank.muscleGroup} Rank promoted from ${oldRank} to ${muscleRank.rank}`
      });
    }
  });

  return promotions;
};
