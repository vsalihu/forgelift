import {
  getDefaultStrengthStandard,
  validateOnboardingInput,
  validStrengthStandards,
  validUnits
} from "../utils/validation.js";

const allowedMeasurements = ["chest", "waist", "hips", "shoulders", "arms", "thighs", "calves", "glutes"];

const sanitizeMeasurements = (measurements = {}) => {
  return allowedMeasurements.reduce((cleaned, key) => {
    const value = measurements[key];

    if (value !== undefined && value !== "" && !Number.isNaN(Number(value))) {
      cleaned[key] = Number(value);
    }

    return cleaned;
  }, {});
};

export const getMe = async (req, res) => {
  return res.json({ user: req.user.toJSON() });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, preferredUnits, selectedStrengthStandard, bodyMeasurements } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
      req.user.name = name.trim();
    }

    if (preferredUnits !== undefined) {
      if (!validUnits.includes(preferredUnits)) {
        return res.status(400).json({ message: "Please select valid preferred units." });
      }
      req.user.preferredUnits = preferredUnits;
    }

    if (selectedStrengthStandard !== undefined) {
      if (!validStrengthStandards.includes(selectedStrengthStandard)) {
        return res.status(400).json({ message: "Please select a valid strength standard." });
      }
      req.user.selectedStrengthStandard = selectedStrengthStandard;
    }

    if (bodyMeasurements !== undefined) {
      req.user.bodyMeasurements = sanitizeMeasurements(bodyMeasurements);
    }

    await req.user.save();
    return res.json({ user: req.user.toJSON() });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      selectedStrengthStandard:
        req.body.selectedStrengthStandard || getDefaultStrengthStandard(req.body.gender)
    };
    const errors = validateOnboardingInput(payload);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    req.user.gender = payload.gender;
    req.user.customGenderLabel = payload.gender === "custom" ? payload.customGenderLabel.trim() : "";
    req.user.selectedStrengthStandard = payload.selectedStrengthStandard;
    req.user.age = Number(payload.age);
    req.user.height = Number(payload.height);
    req.user.bodyweight = Number(payload.bodyweight);
    req.user.preferredUnits = payload.preferredUnits;
    req.user.trainingExperience = payload.trainingExperience;
    req.user.goalPath = payload.goalPath;
    req.user.bodyMeasurements = sanitizeMeasurements(payload.bodyMeasurements);
    req.user.onboardingCompleted = true;

    await req.user.save();
    return res.json({ user: req.user.toJSON() });
  } catch (error) {
    return res.status(500).json({ message: "Unable to complete onboarding.", error: error.message });
  }
};
