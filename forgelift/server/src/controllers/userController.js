import {
  getDefaultStrengthStandard,
  validateOnboardingInput,
  validGoalPaths,
  validStrengthStandards,
  validUnits
} from "../utils/validation.js";
import ActivityFeedItem from "../models/ActivityFeedItem.js";
import Assessment from "../models/Assessment.js";
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
      bodyMeasurements
    } = req.body;

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

    const baseProfile = {
      _id: profileUser._id,
      name: profileUser.name,
      username: profileUser.username,
      currentOverallRank: profileUser.currentOverallRank,
      createdAt: profileUser.createdAt
    };

    if (!isSelf && !isFriend) {
      return res.json({
        profile: baseProfile,
        isSelf,
        isFriend,
        friendRequestStatus,
        friendRequestId: friendship?._id || null
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
      friendRequestId: friendship?._id || null
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load profile.", error: error.message });
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
