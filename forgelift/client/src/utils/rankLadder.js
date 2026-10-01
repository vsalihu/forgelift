// Mirrors server/src/utils/rankConfig.js thresholds for display.
export const RANK_LADDER = [
  { name: "Copper", minScore: 0 },
  { name: "Bronze", minScore: 1000 },
  { name: "Silver", minScore: 2000 },
  { name: "Gold", minScore: 3500 },
  { name: "Platinum", minScore: 5500 },
  { name: "Diamond", minScore: 8000 },
  { name: "Elite", minScore: 11000 },
  { name: "Warrior", minScore: 15000 },
  { name: "Ultimate", minScore: 20000 }
];

export const rankIndex = (name) => Math.max(0, RANK_LADDER.findIndex((rank) => rank.name === name));

export const shortScore = (value) => (value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : String(value));
