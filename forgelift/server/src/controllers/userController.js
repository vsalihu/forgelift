import { getCityById } from "../utils/cities.js";
import {
  getAgeFromDate,
  getDefaultStrengthStandard,
  isValidTimezone,
  parseDateOfBirth,
  validateOnboardingInput,
  validGoalPaths,
  validStrengthStandards,
  validUnits
} from "../utils/validation.js";
import ActivityFeedItem from "../models/ActivityFeedItem.js";
import Assessment from "../models/Assessment.js";
import Block from "../models/Block.js";
import BodyweightEntry from "../models/BodyweightEntry.js";
import Friendship from "../models/Friendship.js";
import MuscleRank from "../models/MuscleRank.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { getUserDataReadiness } from "../utils/getUserDataReadiness.js";
import { getRankProgress } from "../utils/rankConfig.js";

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
  // Keep the stored age current for users who gave a date of birth.
  if (req.user.dateOfBirth) {
    const age = getAgeFromDate(req.user.dateOfBirth);
    if (age !== null && age !== req.user.age) {
      req.user.age = age;
      await req.user.save();
    }
  }
  return res.json({ user: req.user.toJSON() });
};

export const getDataReadiness = async (req, res) => {
  const [workouts, latestAssessment] = await Promise.all([
    Workout.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 }),
    Assessment.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
  ]);
  const readiness = getUserDataReadiness({
    user: req.user,
    workouts,
    baselines: req.user.strengthBaselines || [],
    assessment: latestAssessment
  });

  return res.json({ readiness });
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      preferredUnits,
      selectedStrengthStandard,
      trainingExperience,
      goalPath,
      overloadMode,
      beginnerTipsEnabled,
      bodyweight,
      bodyweightCheckInReminderEnabled,
      bodyweightCheckInDay,
      bodyMeasurements,
      dateOfBirth,
      cityId,
      timezone
    } = req.body;

    if (dateOfBirth !== undefined) {
      const birth = parseDateOfBirth(dateOfBirth);
      if (birth.error) {
        return res.status(400).json({ message: birth.error, field: "dateOfBirth" });
      }
      req.user.dateOfBirth = birth.date;
      req.user.age = birth.age;
    }

    if (cityId !== undefined) {
      const city = getCityById(cityId);
      if (!city) {
        return res.status(400).json({ message: "Choose your city from the list.", field: "cityId" });
      }
      req.user.location = { cityId: city.cityId, cityName: city.name, countryCode: city.countryCode, countryName: city.countryName };
    }

    if (timezone !== undefined && isValidTimezone(timezone)) {
      req.user.timezone = timezone;
    }

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

    if (trainingExperience !== undefined) {
      if (!["Beginner", "Intermediate", "Advanced"].includes(trainingExperience)) {
        return res.status(400).json({ message: "Please select valid training experience." });
      }
      req.user.trainingExperience = trainingExperience;
    }

    if (goalPath !== undefined) {
      if (!validGoalPaths.includes(goalPath)) {
        return res.status(400).json({ message: "Please select a valid goal path." });
      }
      req.user.goalPath = goalPath;
    }

    if (overloadMode !== undefined) {
      if (!["Conservative", "Balanced", "Aggressive"].includes(overloadMode)) {
        return res.status(400).json({ message: "Please select a valid overload mode." });
      }
      req.user.overloadMode = overloadMode;
    }

    if (beginnerTipsEnabled !== undefined) {
      req.user.beginnerTipsEnabled = Boolean(beginnerTipsEnabled);
    }

    if (bodyweight !== undefined && bodyweight !== "") {
      if (Number(bodyweight) <= 0 || Number.isNaN(Number(bodyweight))) {
        return res.status(400).json({ message: "Please enter a valid bodyweight." });
      }
      const nextBodyweight = Number(bodyweight);
      const previousBodyweight = Number(req.user.bodyweight || 0);
      req.user.bodyweight = nextBodyweight;
      if (nextBodyweight !== previousBodyweight) {
        req.user.lastBodyweightCheckInAt = new Date();
        await BodyweightEntry.create({
          userId: req.user._id,
          weight: nextBodyweight,
          unit: req.user.preferredUnits === "imperial" ? "lb" : "kg",
          source: "profile_update"
        });
      }
    }

    if (bodyweightCheckInReminderEnabled !== undefined) {
      req.user.bodyweightCheckInReminderEnabled = Boolean(bodyweightCheckInReminderEnabled);
    }

    if (bodyweightCheckInDay !== undefined) {
      req.user.bodyweightCheckInDay = String(bodyweightCheckInDay || "Monday");
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

export const getPublicProfile = async (req, res) => {
  try {
    const username = (req.params.username || "").trim().toLowerCase();
    const profileUser = await User.findOne({ username });

    if (!profileUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSelf = profileUser._id.equals(req.user._id);
    const [blockedByMe, blockedMe] = isSelf
      ? [false, false]
      : await Promise.all([
          Block.exists({ blockerId: req.user._id, blockedId: profileUser._id }),
          Block.exists({ blockerId: profileUser._id, blockedId: req.user._id })
        ]);

    if (blockedMe) {
      return res.status(404).json({ message: "User not found." });
    }

    let isFriend = false;
    let friendRequestStatus = "none";
    let friendship = null;

    if (!isSelf) {
      friendship = await Friendship.findOne({
        $or: [
          { requesterId: req.user._id, recipientId: profileUser._id },
          { requesterId: profileUser._id, recipientId: req.user._id }
        ]
      });

      if (friendship) {
        if (friendship.status === "accepted") {
          isFriend = true;
        } else {
          friendRequestStatus = friendship.requesterId.equals(req.user._id) ? "sent" : "received";
        }
      }
    }

    const competitor = Boolean(profileUser.competition?.enabled);
    const baseProfile = {
      _id: profileUser._id,
      name: profileUser.name,
      username: profileUser.username,
      currentOverallRank: profileUser.currentOverallRank,
      createdAt: profileUser.createdAt,
      competition: competitor
        ? { cityName: profileUser.competition.cityName, countryName: profileUser.competition.countryName }
        : null
    };
    const interaction = {
      isBlockedByMe: Boolean(blockedByMe),
      canChallenge: !isSelf && !blockedByMe && (isFriend || (competitor && Boolean(req.user.competition?.enabled)))
    };

    if (!isSelf && !isFriend) {
      return res.json({
        profile: baseProfile,
        isSelf,
        isFriend,
        friendRequestStatus,
        friendRequestId: friendship?._id || null,
        interaction
      });
    }

    const [muscleRanks, publicWorkouts, recentActivity] = await Promise.all([
      MuscleRank.find({ userId: profileUser._id }).sort({ score: -1 }),
      WorkoutTemplate.find({ userId: profileUser._id, visibility: "public" }).sort({ updatedAt: -1 }),
      ActivityFeedItem.find({ userId: profileUser._id, type: "workout_completed" }).sort({ createdAt: -1 }).limit(10)
    ]);

    return res.json({
      profile: {
        ...baseProfile,
        overallRankScore: profileUser.overallRankScore,
        overallProgress: getRankProgress(profileUser.overallRankScore || 0),
        xp: profileUser.xp,
        lifetimeVolume: profileUser.lifetimeVolume,
        lifetimeReps: profileUser.lifetimeReps,
        lifetimeSets: profileUser.lifetimeSets,
        lifetimeWorkoutCount: profileUser.lifetimeWorkoutCount
      },
      muscleRanks,
      publicWorkouts,
      recentActivity,
      isSelf,
      isFriend,
      friendRequestStatus,
      friendRequestId: friendship?._id || null,
      interaction
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load profile.", error: error.message });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      // Users who gave a date of birth at sign-up aren't asked for their age again.
      age: req.user.dateOfBirth ? getAgeFromDate(req.user.dateOfBirth) : req.body.age,
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
