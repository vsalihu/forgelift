export const calculateEstimated1RM = (weight, reps) => {
  const numericWeight = Number(weight);
  const numericReps = Number(reps);

  if (!numericWeight || !numericReps || numericReps <= 0) {
    return 0;
  }

  const estimated1RM = numericWeight * (1 + numericReps / 30);
  return Math.round(estimated1RM * 10) / 10;
};
