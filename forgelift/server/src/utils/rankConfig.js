export const RANKS = [
  {
    name: "Copper",
    level: 1,
    minScore: 0,
    maxScore: 999,
    colourClass: "text-orange-300 border-orange-700/60 bg-orange-950/40",
    description: "Foundation rank for new training data."
  },
  {
    name: "Bronze",
    level: 2,
    minScore: 1000,
    maxScore: 1999,
    colourClass: "text-amber-300 border-amber-700/60 bg-amber-950/40",
    description: "Early consistency and strength are developing."
  },
  {
    name: "Silver",
    level: 3,
    minScore: 2000,
    maxScore: 3499,
    colourClass: "text-slate-200 border-slate-500/60 bg-slate-800/50",
    description: "Reliable training base with measurable progress."
  },
  {
    name: "Gold",
    level: 4,
    minScore: 3500,
    maxScore: 5499,
    colourClass: "text-yellow-200 border-yellow-500/60 bg-yellow-950/30",
    description: "Strong progress across strength and workload."
  },
  {
    name: "Platinum",
    level: 5,
    minScore: 5500,
    maxScore: 7999,
    colourClass: "text-cyan-100 border-cyan-400/60 bg-cyan-950/30",
    description: "Advanced training output and consistency."
  },
  {
    name: "Diamond",
    level: 6,
    minScore: 8000,
    maxScore: 10999,
    colourClass: "text-sky-200 border-sky-400/60 bg-sky-950/30",
    description: "High performance across key training markers."
  },
  {
    name: "Elite",
    level: 7,
    minScore: 11000,
    maxScore: 14999,
    colourClass: "text-violet-200 border-violet-400/60 bg-violet-950/30",
    description: "Elite-level training output."
  },
  {
    name: "Warrior",
    level: 8,
    minScore: 15000,
    maxScore: 19999,
    colourClass: "text-red-200 border-red-400/60 bg-red-950/30",
    description: "Exceptional strength and training consistency."
  },
  {
    name: "Ultimate",
    level: 9,
    minScore: 20000,
    maxScore: Infinity,
    colourClass: "text-white border-white/70 bg-white/10",
    description: "The highest ForgeLift rank."
  }
];

export const getRankFromScore = (score = 0) => {
  const numericScore = Math.max(0, Number(score) || 0);
  return RANKS.find((rank) => numericScore >= rank.minScore && numericScore <= rank.maxScore) || RANKS[0];
};

export const getNextRank = (score = 0) => {
  const currentRank = getRankFromScore(score);
  return RANKS.find((rank) => rank.level === currentRank.level + 1) || null;
};

export const getRankProgress = (score = 0) => {
  const numericScore = Math.max(0, Number(score) || 0);
  const currentRank = getRankFromScore(numericScore);
  const nextRank = getNextRank(numericScore);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progressPercentage: 100,
      pointsToNextRank: 0
    };
  }

  const rankRange = nextRank.minScore - currentRank.minScore;
  const pointsIntoRank = numericScore - currentRank.minScore;
  const progressPercentage = Math.min(100, Math.max(0, Math.round((pointsIntoRank / rankRange) * 100)));

  return {
    currentRank,
    nextRank,
    progressPercentage,
    pointsToNextRank: Math.max(0, nextRank.minScore - numericScore)
  };
};
