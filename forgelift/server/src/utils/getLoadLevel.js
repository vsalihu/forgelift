export const getLoadLevel = (load = 0) => {
  const numericLoad = Number(load) || 0;

  if (numericLoad >= 1500) return "Very High";
  if (numericLoad >= 800) return "High";
  if (numericLoad >= 300) return "Medium";
  return "Low";
};
