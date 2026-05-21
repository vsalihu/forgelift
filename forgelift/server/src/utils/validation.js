export const validGenderOptions = ["male", "female", "prefer_not_to_say", "custom"];
export const validStrengthStandards = ["male", "female", "neutral"];
export const validUnits = ["metric", "imperial"];
export const validExperienceLevels = ["Beginner", "Intermediate", "Advanced"];
export const validGoalPaths = [
  "Strength Warrior",
  "Muscle Builder",
  "Fat Loss Fighter",
  "Athletic Performance",
  "Beginner Foundation",
  "Balanced Beast",
  "Glute Growth"
];

export const getDefaultStrengthStandard = (gender) => {
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "neutral";
};

export const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const validateRequiredNumber = (value, fieldName, errors) => {
  const numberValue = Number(value);

  if (value === undefined || value === null || value === "" || Number.isNaN(numberValue)) {
    errors.push(`${fieldName} is required.`);
    return;
  }

  if (numberValue <= 0) {
    errors.push(`${fieldName} must be greater than 0.`);
  }
};

export const validateOnboardingInput = (payload) => {
  const errors = [];

  if (!validGenderOptions.includes(payload.gender)) {
    errors.push("Please select a valid gender option.");
  }

  if (payload.gender === "custom" && !payload.customGenderLabel?.trim()) {
    errors.push("Please enter a custom gender label or choose another option.");
  }

  if (!validStrengthStandards.includes(payload.selectedStrengthStandard)) {
    errors.push("Please select a valid strength standard.");
  }

  validateRequiredNumber(payload.age, "Age", errors);
  validateRequiredNumber(payload.height, "Height", errors);
  validateRequiredNumber(payload.bodyweight, "Bodyweight", errors);

  if (!validUnits.includes(payload.preferredUnits)) {
    errors.push("Please select valid preferred units.");
  }

  if (!validExperienceLevels.includes(payload.trainingExperience)) {
    errors.push("Please select valid training experience.");
  }

  if (!validGoalPaths.includes(payload.goalPath)) {
    errors.push("Please select a valid goal path.");
  }

  return errors;
};
