const rankImages = {
  Copper: "copper",
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
  Platinum: "platinum",
  Diamond: "diamond",
  Elite: "elite",
  Warrior: "warrior",
  Ultimate: "ultimate"
};

export const getRankImage = (rank = "") => (rankImages[rank] ? `/ranks/${rankImages[rank]}.png` : null);
