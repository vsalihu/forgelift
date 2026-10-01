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

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

export const MIN_SIGNUP_AGE = 13;
export const MIN_PASSWORD_LENGTH = 8;

// Whole years between a date of birth and now.
export const getAgeFromDate = (dateOfBirth, now = new Date()) => {
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

// Accepts "YYYY-MM-DD". Returns { date } or { error }.
export const parseDateOfBirth = (value, now = new Date()) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return { error: "Enter your date of birth." };
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { error: "That date doesn't exist." };
  }
  const age = getAgeFromDate(date, now);
  if (age < 0 || date > now) return { error: "Your date of birth can't be in the future." };
  if (age > 110) return { error: "Please check the year you were born." };
  if (age < MIN_SIGNUP_AGE) return { error: `You need to be at least ${MIN_SIGNUP_AGE} to use ForgeLift.` };
  return { date, age };
};

export const validatePassword = (password) => {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return "Use at least one letter and one number.";
  return "";
};

export const isValidTimezone = (timezone) => {
  if (!timezone || typeof timezone !== "string" || timezone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch (_error) {
    return false;
  }
};

// Countries where gyms mostly load in pounds. Used only as the default before onboarding.
const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);
export const getDefaultUnitsForCountry = (countryCode) => (IMPERIAL_COUNTRIES.has(countryCode) ? "imperial" : "metric");

export const validateUsername = (username) => /^[a-z0-9_]{3,20}$/.test(username || "");

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
  if (Number(payload.age) > 0 && Number(payload.age) < MIN_SIGNUP_AGE) {
    errors.push(`You need to be at least ${MIN_SIGNUP_AGE} to use ForgeLift.`);
  }
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
