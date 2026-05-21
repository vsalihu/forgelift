import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import Exercise from "../models/Exercise.js";
import { getBroadGroupsForMuscle, normalizeMuscleName } from "./muscleTaxonomy.js";

dotenv.config();

const exerciseDetailOverrides = {
  "Bench Press": {
    primaryMuscles: ["Mid Chest"],
    secondaryMuscles: ["Front Delts", "Triceps"],
    impactProfile: { Chest: 100, "Mid Chest": 100, "Front Delts": 40, Triceps: 35, Core: 10 }
  },
  "Incline Bench Press": {
    primaryMuscles: ["Upper Chest"],
    secondaryMuscles: ["Front Delts", "Triceps"],
    impactProfile: { "Upper Chest": 100, Chest: 80, "Front Delts": 55, Triceps: 35, Core: 10 }
  },
  "Decline Bench Press": {
    primaryMuscles: ["Lower Chest"],
    secondaryMuscles: ["Triceps", "Front Delts", "Chest"],
    impactProfile: { "Lower Chest": 100, Chest: 80, Triceps: 35, "Front Delts": 25, Core: 10 }
  },
  "Cable Fly": {
    primaryMuscles: ["Mid Chest", "Inner Chest"],
    secondaryMuscles: ["Front Delts"],
    impactProfile: { "Mid Chest": 100, "Inner Chest": 70, Chest: 85, "Front Delts": 20, Core: 10 }
  },
  "High Cable Fly": {
    primaryMuscles: ["Lower Chest"],
    secondaryMuscles: ["Chest"],
    impactProfile: { "Lower Chest": 100, Chest: 75, "Front Delts": 20, Core: 10 }
  },
  "Overhead Press": {
    primaryMuscles: ["Front Delts", "Side Delts"],
    secondaryMuscles: ["Triceps", "Upper Chest"],
    stabiliserMuscles: ["Core"],
    impactProfile: { "Front Delts": 100, "Side Delts": 70, Triceps: 55, "Upper Chest": 30, Core: 20 }
  },
  "Lateral Raise": {
    primaryMuscles: ["Side Delts"],
    secondaryMuscles: ["Traps"],
    impactProfile: { "Side Delts": 100, Traps: 20 }
  },
  "Cable Lateral Raise": {
    primaryMuscles: ["Side Delts"],
    secondaryMuscles: ["Traps"],
    impactProfile: { "Side Delts": 100, Traps: 15 }
  },
  "Rear Delt Fly": {
    primaryMuscles: ["Rear Delts"],
    secondaryMuscles: ["Upper Back", "Traps"],
    impactProfile: { "Rear Delts": 100, "Upper Back": 35, Traps: 25 }
  },
  "Reverse Pec Deck": {
    primaryMuscles: ["Rear Delts"],
    secondaryMuscles: ["Upper Back", "Traps"],
    impactProfile: { "Rear Delts": 100, "Upper Back": 40, Traps: 25 }
  },
  "Face Pull": {
    primaryMuscles: ["Rear Delts"],
    secondaryMuscles: ["Upper Back", "Traps", "Rotator Cuff"],
    impactProfile: { "Rear Delts": 100, "Upper Back": 60, Traps: 35, "Rotator Cuff": 25, Core: 10 }
  },
  "Squat": {
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Adductors", "Core"],
    stabiliserMuscles: ["Lower Back", "Abs"],
    impactProfile: { Quads: 100, Glutes: 75, Hamstrings: 45, Adductors: 35, Core: 30, "Lower Back": 25 }
  },
  "Leg Press": {
    primaryMuscles: ["Quads"],
    secondaryMuscles: ["Glutes", "Hamstrings", "Calves"],
    impactProfile: { Quads: 100, Glutes: 55, Hamstrings: 35, Calves: 15 }
  },
  "Leg Extension": {
    primaryMuscles: ["Quads"],
    secondaryMuscles: [],
    impactProfile: { Quads: 100 }
  },
  "Hip Abduction Machine": {
    mainMuscleGroups: ["Glutes", "Legs"],
    primaryMuscles: ["Abductors", "Glute Medius"],
    secondaryMuscles: ["Glute Minimus", "Glute Maximus"],
    impactProfile: { Abductors: 100, "Glute Medius": 95, "Glute Minimus": 70, "Glute Maximus": 35 }
  },
  "Bulgarian Split Squat": {
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Adductors", "Core"],
    impactProfile: { Quads: 100, Glutes: 75, Hamstrings: 35, Adductors: 25, Core: 20 }
  },
  "Walking Lunge": {
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Adductors", "Core"],
    impactProfile: { Quads: 100, Glutes: 70, Hamstrings: 30, Adductors: 25, Core: 20 }
  },
  "Reverse Lunge": {
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Adductors"],
    impactProfile: { Quads: 100, Glutes: 65, Hamstrings: 30, Adductors: 20, Core: 15 }
  },
  "Goblet Squat": {
    primaryMuscles: ["Quads"],
    secondaryMuscles: ["Glutes", "Core"],
    impactProfile: { Quads: 100, Glutes: 55, Core: 30 }
  },
  "Smith Machine Squat": {
    primaryMuscles: ["Quads"],
    secondaryMuscles: ["Glutes", "Hamstrings"],
    impactProfile: { Quads: 100, Glutes: 50, Hamstrings: 25, Core: 10 }
  },
  "Box Squat": {
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    impactProfile: { Quads: 100, Glutes: 60, Hamstrings: 35, Core: 25, "Lower Back": 20 }
  },
  "Romanian Deadlift": {
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Lower Back", "Core"],
    impactProfile: { Hamstrings: 100, Glutes: 75, "Lower Back": 40, Core: 20 }
  },
  "Bicep Curl": {
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Brachialis", "Brachioradialis", "Forearms"],
    impactProfile: { Biceps: 100, "Biceps Short Head": 55, "Biceps Long Head": 55, Brachialis: 45, Brachioradialis: 30, Forearms: 25 }
  },
  "Hammer Curl": {
    primaryMuscles: ["Brachialis", "Brachioradialis"],
    secondaryMuscles: ["Biceps", "Forearms"],
    impactProfile: { Brachialis: 100, Brachioradialis: 90, Biceps: 55, Forearms: 45 }
  },
  "Incline Dumbbell Curl": {
    primaryMuscles: ["Biceps Long Head"],
    secondaryMuscles: ["Biceps", "Brachialis", "Forearms"],
    impactProfile: { "Biceps Long Head": 100, Biceps: 80, Brachialis: 35, Forearms: 20 }
  },
  "Preacher Curl": {
    primaryMuscles: ["Biceps Short Head"],
    secondaryMuscles: ["Biceps", "Brachialis"],
    impactProfile: { "Biceps Short Head": 100, Biceps: 80, Brachialis: 40 }
  },
  "Reverse Curl": {
    primaryMuscles: ["Brachioradialis", "Brachialis"],
    secondaryMuscles: ["Biceps", "Forearms"],
    impactProfile: { Brachioradialis: 100, Brachialis: 85, Biceps: 55, Forearms: 55 }
  },
  "Cuban Press": {
    primaryMuscles: ["Rotator Cuff", "Rear Delts"],
    secondaryMuscles: ["Side Delts", "Traps"],
    impactProfile: { "Rotator Cuff": 85, "Rear Delts": 75, "Side Delts": 50, Traps: 35 }
  },
  "Cable Curl": {
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Biceps Short Head", "Brachialis", "Forearms"],
    impactProfile: { Biceps: 100, "Biceps Short Head": 70, Brachialis: 35, Forearms: 20 }
  },
  "Concentration Curl": {
    primaryMuscles: ["Biceps Short Head"],
    secondaryMuscles: ["Biceps", "Brachialis"],
    impactProfile: { "Biceps Short Head": 100, Biceps: 85, Brachialis: 30, Forearms: 15 }
  },
  "EZ-Bar Curl": {
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Biceps Short Head", "Biceps Long Head", "Brachialis"],
    impactProfile: { Biceps: 100, "Biceps Short Head": 65, "Biceps Long Head": 55, Brachialis: 35, Forearms: 20 }
  },
  "Tricep Pushdown": {
    primaryMuscles: ["Triceps Lateral Head", "Triceps Medial Head"],
    secondaryMuscles: ["Triceps"],
    impactProfile: { Triceps: 100, "Triceps Lateral Head": 80, "Triceps Medial Head": 65, "Triceps Long Head": 35 }
  },
  "Overhead Tricep Extension": {
    primaryMuscles: ["Triceps Long Head"],
    secondaryMuscles: ["Triceps"],
    impactProfile: { "Triceps Long Head": 100, Triceps: 85, "Triceps Medial Head": 40 }
  },
  "Lat Pulldown": {
    primaryMuscles: ["Lats"],
    secondaryMuscles: ["Biceps", "Brachialis", "Rear Delts", "Upper Back"],
    impactProfile: { Lats: 100, Back: 85, Biceps: 35, Brachialis: 25, "Rear Delts": 20, "Upper Back": 25 }
  },
  "Straight-Arm Pulldown": {
    primaryMuscles: ["Lats", "Teres Major"],
    secondaryMuscles: ["Triceps", "Core"],
    impactProfile: { Lats: 100, "Teres Major": 70, Triceps: 15, Core: 10 }
  },
  "Upright Row": {
    primaryMuscles: ["Side Delts", "Traps"],
    secondaryMuscles: ["Front Delts"],
    impactProfile: { "Side Delts": 100, Traps: 65, "Front Delts": 35 }
  },
  "Barbell Row": {
    primaryMuscles: ["Mid Back", "Lats"],
    secondaryMuscles: ["Rear Delts", "Biceps", "Traps", "Lower Back"],
    impactProfile: { "Mid Back": 100, Lats: 75, "Rear Delts": 45, Biceps: 35, Traps: 35, "Lower Back": 30 }
  }
};

const normalizeList = (items = []) => [...new Set(items.map(normalizeMuscleName).filter(Boolean))];
const getMainGroups = (exercise) => {
  const muscles = [
    exercise.category,
    ...(exercise.primaryMuscles || []),
    ...(exercise.secondaryMuscles || []),
    ...(exercise.stabiliserMuscles || []),
    ...Object.keys(exercise.impactProfile || {})
  ];
  return [...new Set(muscles.flatMap(getBroadGroupsForMuscle))];
};

const enrichExercise = (exercise) => {
  const override = exerciseDetailOverrides[exercise.name] || {};
  const merged = { ...exercise, ...override };
  merged.primaryMuscles = normalizeList(merged.primaryMuscles);
  merged.secondaryMuscles = normalizeList(merged.secondaryMuscles);
  merged.stabiliserMuscles = normalizeList(merged.stabiliserMuscles);
  merged.impactProfile = Object.entries(merged.impactProfile || {}).reduce((profile, [muscle, impact]) => {
    profile[normalizeMuscleName(muscle)] = impact;
    return profile;
  }, {});
  merged.mainMuscleGroups = merged.mainMuscleGroups?.length ? merged.mainMuscleGroups : getMainGroups(merged);
  merged.detailedMuscles = normalizeList([
    ...merged.primaryMuscles,
    ...merged.secondaryMuscles,
    ...merged.stabiliserMuscles,
    ...Object.keys(merged.impactProfile)
  ]).filter((muscle) => !merged.mainMuscleGroups.includes(muscle));
  return merged;
};

const ex = ({
  name,
  category,
  exerciseType = "compound",
  primaryMuscles = [],
  secondaryMuscles = [],
  stabiliserMuscles = [],
  defaultRepMin = 8,
  defaultRepMax = 12,
  overloadIncrementKg = 2.5,
  impactProfile = {},
  instructions,
  equipment = "barbell",
  difficulty = "Intermediate",
  movementPattern = "compound"
}) =>
  enrichExercise({
    name,
    category,
    exerciseType,
    primaryMuscles,
    secondaryMuscles,
    stabiliserMuscles,
    defaultRepMin,
    defaultRepMax,
    overloadIncrementKg,
    impactProfile,
    instructions:
      instructions ||
      `Perform ${name} with controlled technique, full usable range of motion, and steady bracing. Stop the set if form breaks down.`,
    equipment,
    difficulty,
    movementPattern,
    isDefault: true
  });

export const defaultExercises = [
  ex({
    name: "Bench Press",
    category: "Chest",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Front Shoulders", "Triceps"],
    stabiliserMuscles: ["Core"],
    defaultRepMin: 6,
    defaultRepMax: 10,
    overloadIncrementKg: 2.5,
    impactProfile: { Chest: 100, "Front Shoulders": 40, Triceps: 35, Core: 10 },
    equipment: "barbell",
    movementPattern: "horizontal press"
  }),
  ex({
    name: "Incline Bench Press",
    category: "Chest",
    primaryMuscles: ["Upper Chest"],
    secondaryMuscles: ["Front Shoulders", "Triceps"],
    stabiliserMuscles: ["Core"],
    defaultRepMin: 6,
    defaultRepMax: 10,
    impactProfile: { "Upper Chest": 100, "Front Shoulders": 55, Triceps: 35, Core: 10 },
    equipment: "barbell",
    movementPattern: "incline press"
  }),
  ex({ name: "Decline Bench Press", category: "Chest", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 10, impactProfile: { Chest: 100, Triceps: 35, "Front Shoulders": 25, Core: 10 }, equipment: "barbell", movementPattern: "decline press" }),
  ex({ name: "Dumbbell Bench Press", category: "Chest", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders", "Triceps"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Chest: 100, "Front Shoulders": 35, Triceps: 30, Core: 15 }, equipment: "dumbbell", movementPattern: "horizontal press" }),
  ex({ name: "Incline Dumbbell Press", category: "Chest", primaryMuscles: ["Upper Chest"], secondaryMuscles: ["Front Shoulders", "Triceps"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { "Upper Chest": 100, "Front Shoulders": 55, Triceps: 30, Core: 10 }, equipment: "dumbbell", movementPattern: "incline press" }),
  ex({ name: "Chest Press Machine", category: "Chest", exerciseType: "machine", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders", "Triceps"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Chest: 100, "Front Shoulders": 30, Triceps: 30 }, equipment: "machine", movementPattern: "horizontal press" }),
  ex({ name: "Smith Machine Bench Press", category: "Chest", exerciseType: "machine", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders", "Triceps"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 10, impactProfile: { Chest: 100, "Front Shoulders": 35, Triceps: 35, Core: 8 }, equipment: "smith machine", movementPattern: "horizontal press" }),
  ex({ name: "Cable Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Chest: 100, "Front Shoulders": 20, Core: 10 }, equipment: "cable", movementPattern: "fly" }),
  ex({ name: "Pec Deck", category: "Chest", exerciseType: "machine", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Chest: 100, "Front Shoulders": 15 }, equipment: "machine", movementPattern: "fly" }),
  ex({ name: "Push-Up", category: "Chest", exerciseType: "bodyweight", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Chest: 100, Triceps: 35, "Front Shoulders": 30, Core: 20 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "horizontal press" }),
  ex({ name: "Weighted Push-Up", category: "Chest", exerciseType: "bodyweight", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 12, impactProfile: { Chest: 100, Triceps: 35, "Front Shoulders": 30, Core: 20 }, equipment: "bodyweight", movementPattern: "horizontal press" }),
  ex({ name: "Dip", category: "Chest", exerciseType: "bodyweight", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 12, impactProfile: { Chest: 90, Triceps: 60, "Front Shoulders": 35, Core: 15 }, equipment: "bodyweight", movementPattern: "dip" }),
  ex({ name: "Dumbbell Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Chest: 100, "Front Shoulders": 25, Core: 10 }, equipment: "dumbbell", movementPattern: "fly" }),
  ex({ name: "Low Cable Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Upper Chest"], secondaryMuscles: ["Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Upper Chest": 100, Chest: 45, "Front Shoulders": 25, Core: 10 }, equipment: "cable", movementPattern: "fly" }),
  ex({ name: "High Cable Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Chest: 100, "Front Shoulders": 20, Core: 10 }, equipment: "cable", movementPattern: "fly" }),

  ex({ name: "Pull-up", category: "Back", exerciseType: "bodyweight", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core", "Grip"], defaultRepMin: 6, defaultRepMax: 12, impactProfile: { Back: 100, Biceps: 45, "Rear Shoulders": 20, Core: 15, Grip: 20 }, equipment: "bodyweight", movementPattern: "vertical pull" }),
  ex({ name: "Chin-Up", category: "Back", exerciseType: "bodyweight", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core", "Grip"], defaultRepMin: 6, defaultRepMax: 12, impactProfile: { Back: 95, Biceps: 60, "Rear Shoulders": 18, Core: 15, Grip: 20 }, equipment: "bodyweight", movementPattern: "vertical pull" }),
  ex({ name: "Lat Pulldown", category: "Back", exerciseType: "machine", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Back: 100, Biceps: 35, "Rear Shoulders": 20 }, equipment: "cable", movementPattern: "vertical pull" }),
  ex({ name: "Close-Grip Lat Pulldown", category: "Back", exerciseType: "machine", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Back: 100, Biceps: 45, "Rear Shoulders": 15 }, equipment: "cable", movementPattern: "vertical pull" }),
  ex({ name: "Barbell Row", category: "Back", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core", "Lower Back"], defaultRepMin: 6, defaultRepMax: 10, impactProfile: { Back: 100, Biceps: 40, "Rear Shoulders": 35, Core: 20, "Lower Back": 25 }, equipment: "barbell", movementPattern: "horizontal pull" }),
  ex({ name: "Dumbbell Row", category: "Back", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Back: 100, Biceps: 35, "Rear Shoulders": 30, Core: 15 }, equipment: "dumbbell", movementPattern: "horizontal pull" }),
  ex({ name: "Seated Cable Row", category: "Back", exerciseType: "machine", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Back: 100, Biceps: 35, "Rear Shoulders": 30, Core: 10 }, equipment: "cable", movementPattern: "horizontal pull" }),
  ex({ name: "Chest-Supported Row", category: "Back", primaryMuscles: ["Back"], secondaryMuscles: ["Rear Shoulders", "Biceps"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Back: 100, "Rear Shoulders": 35, Biceps: 30 }, equipment: "machine", movementPattern: "horizontal pull" }),
  ex({ name: "T-Bar Row", category: "Back", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: ["Core", "Lower Back"], defaultRepMin: 6, defaultRepMax: 10, impactProfile: { Back: 100, Biceps: 35, "Rear Shoulders": 35, Core: 15, "Lower Back": 20 }, equipment: "barbell", movementPattern: "horizontal pull" }),
  ex({ name: "Machine Row", category: "Back", exerciseType: "machine", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Shoulders"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Back: 100, Biceps: 30, "Rear Shoulders": 25 }, equipment: "machine", movementPattern: "horizontal pull" }),
  ex({ name: "Straight-Arm Pulldown", category: "Back", exerciseType: "isolation", primaryMuscles: ["Back"], secondaryMuscles: ["Triceps"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Back: 100, Triceps: 15, Core: 10 }, equipment: "cable", movementPattern: "pulldown" }),
  ex({ name: "Face Pull", category: "Back", exerciseType: "isolation", primaryMuscles: ["Rear Shoulders"], secondaryMuscles: ["Upper Back", "Traps"], stabiliserMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rear Shoulders": 100, "Upper Back": 60, Traps: 35, Core: 10 }, equipment: "cable", difficulty: "Beginner", movementPattern: "rear delt pull" }),
  ex({ name: "Rear Delt Row", category: "Back", primaryMuscles: ["Rear Shoulders", "Upper Back"], secondaryMuscles: ["Back", "Biceps"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, impactProfile: { "Rear Shoulders": 100, "Upper Back": 70, Back: 45, Biceps: 25, Core: 10 }, equipment: "dumbbell", movementPattern: "horizontal pull" }),
  ex({ name: "Deadlift", category: "Full Body", primaryMuscles: ["Back", "Legs"], secondaryMuscles: ["Glutes", "Hamstrings", "Core", "Grip"], stabiliserMuscles: ["Lower Back"], defaultRepMin: 3, defaultRepMax: 6, overloadIncrementKg: 5, impactProfile: { Back: 75, Legs: 70, Glutes: 70, Hamstrings: 70, Core: 50, Grip: 40, "Lower Back": 55 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "hinge" }),
  ex({ name: "Rack Pull", category: "Back", primaryMuscles: ["Back", "Lower Back"], secondaryMuscles: ["Glutes", "Hamstrings", "Grip"], stabiliserMuscles: ["Core"], defaultRepMin: 3, defaultRepMax: 6, overloadIncrementKg: 5, impactProfile: { Back: 90, "Lower Back": 70, Glutes: 45, Hamstrings: 35, Grip: 45, Core: 25 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "hinge" }),

  ex({ name: "Squat", category: "Legs", primaryMuscles: ["Legs"], secondaryMuscles: ["Glutes", "Core", "Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 5, defaultRepMax: 10, overloadIncrementKg: 5, impactProfile: { Legs: 100, Glutes: 65, Core: 35, "Lower Back": 25 }, equipment: "barbell", movementPattern: "squat" }),
  ex({ name: "Front Squat", category: "Legs", primaryMuscles: ["Legs", "Quads"], secondaryMuscles: ["Core", "Glutes"], stabiliserMuscles: ["Upper Back"], defaultRepMin: 5, defaultRepMax: 10, overloadIncrementKg: 5, impactProfile: { Legs: 100, Quads: 90, Core: 45, Glutes: 45, "Upper Back": 20 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "squat" }),
  ex({ name: "Hack Squat", category: "Legs", exerciseType: "machine", primaryMuscles: ["Legs", "Quads"], secondaryMuscles: ["Glutes"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Legs: 100, Quads: 90, Glutes: 35 }, equipment: "machine", movementPattern: "squat" }),
  ex({ name: "Leg Press", category: "Legs", exerciseType: "machine", primaryMuscles: ["Legs"], secondaryMuscles: ["Glutes"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Legs: 100, Glutes: 45 }, equipment: "machine", movementPattern: "squat" }),
  ex({ name: "Bulgarian Split Squat", category: "Legs", primaryMuscles: ["Legs", "Glutes"], secondaryMuscles: ["Hamstrings", "Core"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Legs: 100, Glutes: 75, Hamstrings: 35, Core: 20 }, equipment: "dumbbell", movementPattern: "single leg" }),
  ex({ name: "Walking Lunge", category: "Legs", primaryMuscles: ["Legs", "Glutes"], secondaryMuscles: ["Hamstrings", "Core"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 2, impactProfile: { Legs: 100, Glutes: 70, Hamstrings: 30, Core: 20 }, equipment: "dumbbell", movementPattern: "single leg" }),
  ex({ name: "Reverse Lunge", category: "Legs", primaryMuscles: ["Legs", "Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Legs: 100, Glutes: 65, Hamstrings: 30, Core: 15 }, equipment: "dumbbell", movementPattern: "single leg" }),
  ex({ name: "Leg Extension", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Quads", "Legs"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Quads: 100, Legs: 80 }, equipment: "machine", difficulty: "Beginner", movementPattern: "knee extension" }),
  ex({ name: "Step-Up", category: "Legs", primaryMuscles: ["Legs", "Glutes"], secondaryMuscles: ["Hamstrings", "Core"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Legs: 100, Glutes: 75, Hamstrings: 25, Core: 20 }, equipment: "dumbbell", movementPattern: "single leg" }),
  ex({ name: "Goblet Squat", category: "Legs", primaryMuscles: ["Legs"], secondaryMuscles: ["Glutes", "Core"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 2, impactProfile: { Legs: 100, Glutes: 55, Core: 30 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "squat" }),
  ex({ name: "Smith Machine Squat", category: "Legs", exerciseType: "machine", primaryMuscles: ["Legs"], secondaryMuscles: ["Glutes"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Legs: 100, Glutes: 50, Core: 10 }, equipment: "smith machine", movementPattern: "squat" }),
  ex({ name: "Calf Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Calves"], secondaryMuscles: ["Legs"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Calves: 100, Legs: 15 }, equipment: "machine", difficulty: "Beginner", movementPattern: "calf raise" }),
  ex({ name: "Seated Calf Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Calves"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Calves: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "calf raise" }),
  ex({ name: "Sled Push", category: "Full Body", exerciseType: "cardio", primaryMuscles: ["Legs", "Cardio"], secondaryMuscles: ["Glutes", "Core", "Calves"], stabiliserMuscles: ["Shoulders"], defaultRepMin: 1, defaultRepMax: 6, overloadIncrementKg: 5, impactProfile: { Legs: 90, Cardio: 80, Glutes: 60, Core: 35, Calves: 30, Shoulders: 15 }, equipment: "sled", movementPattern: "conditioning" }),
  ex({ name: "Box Squat", category: "Legs", primaryMuscles: ["Legs"], secondaryMuscles: ["Glutes", "Core"], stabiliserMuscles: ["Lower Back"], defaultRepMin: 5, defaultRepMax: 8, overloadIncrementKg: 5, impactProfile: { Legs: 100, Glutes: 60, Core: 25, "Lower Back": 20 }, equipment: "barbell", movementPattern: "squat" }),

  ex({ name: "Hip Thrust", category: "Glutes", primaryMuscles: ["Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Glutes: 100, Hamstrings: 40, Core: 20 }, equipment: "barbell", movementPattern: "hip extension" }),
  ex({ name: "Barbell Hip Thrust", category: "Glutes", primaryMuscles: ["Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Glutes: 100, Hamstrings: 40, Core: 20 }, equipment: "barbell", movementPattern: "hip extension" }),
  ex({ name: "Glute Bridge", category: "Glutes", primaryMuscles: ["Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Glutes: 100, Hamstrings: 35, Core: 20 }, equipment: "barbell", difficulty: "Beginner", movementPattern: "hip extension" }),
  ex({ name: "Cable Kickback", category: "Glutes", exerciseType: "isolation", primaryMuscles: ["Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Glutes: 100, Hamstrings: 20, Core: 10 }, equipment: "cable", movementPattern: "hip extension" }),
  ex({ name: "Glute Machine Kickback", category: "Glutes", exerciseType: "machine", primaryMuscles: ["Glutes"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Glutes: 100, Hamstrings: 20 }, equipment: "machine", movementPattern: "hip extension" }),
  ex({ name: "Romanian Deadlift", category: "Hamstrings", primaryMuscles: ["Hamstrings"], secondaryMuscles: ["Glutes", "Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 5, impactProfile: { Hamstrings: 100, Glutes: 75, "Lower Back": 40, Core: 20 }, equipment: "barbell", movementPattern: "hinge" }),
  ex({ name: "Single-Leg Romanian Deadlift", category: "Hamstrings", primaryMuscles: ["Hamstrings", "Glutes"], secondaryMuscles: ["Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Hamstrings: 100, Glutes: 80, "Lower Back": 25, Core: 25 }, equipment: "dumbbell", movementPattern: "single leg hinge" }),
  ex({ name: "Sumo Deadlift", category: "Full Body", primaryMuscles: ["Glutes", "Legs"], secondaryMuscles: ["Hamstrings", "Back", "Grip"], stabiliserMuscles: ["Core", "Lower Back"], defaultRepMin: 3, defaultRepMax: 6, overloadIncrementKg: 5, impactProfile: { Glutes: 90, Legs: 85, Hamstrings: 60, Back: 55, Grip: 35, Core: 35, "Lower Back": 35 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "hinge" }),
  ex({ name: "Frog Pump", category: "Glutes", exerciseType: "bodyweight", primaryMuscles: ["Glutes"], secondaryMuscles: [], stabiliserMuscles: ["Core"], defaultRepMin: 15, defaultRepMax: 30, overloadIncrementKg: 0, impactProfile: { Glutes: 100, Core: 10 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "hip extension" }),
  ex({ name: "Hip Abduction Machine", category: "Glutes", exerciseType: "machine", primaryMuscles: ["Glutes"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Glutes: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Cable Pull-Through", category: "Glutes", primaryMuscles: ["Glutes", "Hamstrings"], secondaryMuscles: ["Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, impactProfile: { Glutes: 100, Hamstrings: 75, "Lower Back": 25, Core: 15 }, equipment: "cable", movementPattern: "hinge" }),
  ex({ name: "Curtsy Lunge", category: "Glutes", primaryMuscles: ["Glutes", "Legs"], secondaryMuscles: ["Hamstrings"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Glutes: 100, Legs: 70, Hamstrings: 25, Core: 15 }, equipment: "dumbbell", movementPattern: "single leg" }),
  ex({ name: "Kettlebell Swing", category: "Full Body", primaryMuscles: ["Glutes", "Hamstrings"], secondaryMuscles: ["Back", "Core", "Cardio"], stabiliserMuscles: ["Grip", "Shoulders"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 4, impactProfile: { Glutes: 90, Hamstrings: 80, Back: 35, Core: 35, Cardio: 45, Grip: 20, Shoulders: 15 }, equipment: "kettlebell", movementPattern: "hinge" }),
  ex({ name: "Lying Leg Curl", category: "Hamstrings", exerciseType: "isolation", primaryMuscles: ["Hamstrings"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Hamstrings: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "knee flexion" }),
  ex({ name: "Seated Leg Curl", category: "Hamstrings", exerciseType: "isolation", primaryMuscles: ["Hamstrings"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Hamstrings: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "knee flexion" }),
  ex({ name: "Standing Leg Curl", category: "Hamstrings", exerciseType: "isolation", primaryMuscles: ["Hamstrings"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Hamstrings: 100 }, equipment: "machine", movementPattern: "knee flexion" }),
  ex({ name: "Nordic Curl", category: "Hamstrings", exerciseType: "bodyweight", primaryMuscles: ["Hamstrings"], secondaryMuscles: ["Glutes", "Core"], stabiliserMuscles: ["Core"], defaultRepMin: 4, defaultRepMax: 8, overloadIncrementKg: 0, impactProfile: { Hamstrings: 100, Glutes: 35, Core: 25 }, equipment: "bodyweight", difficulty: "Advanced", movementPattern: "knee flexion" }),
  ex({ name: "Good Morning", category: "Hamstrings", primaryMuscles: ["Hamstrings", "Lower Back"], secondaryMuscles: ["Glutes", "Core"], stabiliserMuscles: ["Upper Back"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2.5, impactProfile: { Hamstrings: 100, "Lower Back": 70, Glutes: 55, Core: 25, "Upper Back": 20 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "hinge" }),
  ex({ name: "Glute-Ham Raise", category: "Hamstrings", exerciseType: "bodyweight", primaryMuscles: ["Hamstrings", "Glutes"], secondaryMuscles: ["Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 12, overloadIncrementKg: 0, impactProfile: { Hamstrings: 100, Glutes: 55, "Lower Back": 25, Core: 15 }, equipment: "machine", difficulty: "Advanced", movementPattern: "knee flexion" }),
  ex({ name: "Cable Hamstring Curl", category: "Hamstrings", exerciseType: "isolation", primaryMuscles: ["Hamstrings"], secondaryMuscles: [], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Hamstrings: 100, Core: 8 }, equipment: "cable", movementPattern: "knee flexion" }),
  ex({ name: "Stiff-Leg Deadlift", category: "Hamstrings", primaryMuscles: ["Hamstrings"], secondaryMuscles: ["Glutes", "Lower Back"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 10, overloadIncrementKg: 5, impactProfile: { Hamstrings: 100, Glutes: 65, "Lower Back": 45, Core: 20 }, equipment: "barbell", movementPattern: "hinge" }),

  ex({ name: "Overhead Press", category: "Shoulders", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Triceps", "Upper Chest"], stabiliserMuscles: ["Core"], defaultRepMin: 5, defaultRepMax: 8, impactProfile: { Shoulders: 100, Triceps: 45, "Upper Chest": 20, Core: 15 }, equipment: "barbell", movementPattern: "vertical press" }),
  ex({ name: "Seated Dumbbell Shoulder Press", category: "Shoulders", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Shoulders: 100, "Front Shoulders": 70, Triceps: 40, Core: 10 }, equipment: "dumbbell", movementPattern: "vertical press" }),
  ex({ name: "Arnold Press", category: "Shoulders", primaryMuscles: ["Shoulders", "Front Shoulders"], secondaryMuscles: ["Triceps", "Upper Chest"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Shoulders: 100, "Front Shoulders": 80, Triceps: 35, "Upper Chest": 20, Core: 10 }, equipment: "dumbbell", movementPattern: "vertical press" }),
  ex({ name: "Machine Shoulder Press", category: "Shoulders", exerciseType: "machine", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Triceps", "Front Shoulders"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Shoulders: 100, "Front Shoulders": 65, Triceps: 35 }, equipment: "machine", movementPattern: "vertical press" }),
  ex({ name: "Lateral Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Traps"], stabiliserMuscles: [], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Shoulders: 100, Traps: 15 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "raise" }),
  ex({ name: "Cable Lateral Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Traps"], stabiliserMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Shoulders: 100, Traps: 15, Core: 8 }, equipment: "cable", movementPattern: "raise" }),
  ex({ name: "Front Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Front Shoulders"], secondaryMuscles: ["Shoulders", "Upper Chest"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Front Shoulders": 100, Shoulders: 60, "Upper Chest": 20, Core: 8 }, equipment: "dumbbell", movementPattern: "raise" }),
  ex({ name: "Rear Delt Fly", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Rear Shoulders"], secondaryMuscles: ["Upper Back", "Traps"], stabiliserMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rear Shoulders": 100, "Upper Back": 45, Traps: 25, Core: 8 }, equipment: "dumbbell", movementPattern: "rear delt fly" }),
  ex({ name: "Reverse Pec Deck", category: "Shoulders", exerciseType: "machine", primaryMuscles: ["Rear Shoulders"], secondaryMuscles: ["Upper Back", "Traps"], stabiliserMuscles: [], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { "Rear Shoulders": 100, "Upper Back": 45, Traps: 25 }, equipment: "machine", movementPattern: "rear delt fly" }),
  ex({ name: "Upright Row", category: "Shoulders", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Traps", "Biceps"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Shoulders: 100, Traps: 55, Biceps: 15, Core: 8 }, equipment: "barbell", movementPattern: "pull" }),
  ex({ name: "Shrug", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Traps"], secondaryMuscles: ["Grip"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 15, impactProfile: { Traps: 100, Grip: 35, Core: 10 }, equipment: "dumbbell", movementPattern: "shrug" }),
  ex({ name: "Landmine Press", category: "Shoulders", primaryMuscles: ["Shoulders", "Front Shoulders"], secondaryMuscles: ["Upper Chest", "Triceps"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, impactProfile: { Shoulders: 100, "Front Shoulders": 70, "Upper Chest": 35, Triceps: 30, Core: 25 }, equipment: "barbell", movementPattern: "angled press" }),
  ex({ name: "Pike Push-Up", category: "Shoulders", exerciseType: "bodyweight", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Triceps", "Upper Chest"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { Shoulders: 100, Triceps: 40, "Upper Chest": 20, Core: 20 }, equipment: "bodyweight", movementPattern: "vertical press" }),
  ex({ name: "Cuban Press", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Shoulders", "Rear Shoulders"], secondaryMuscles: ["Traps"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Shoulders: 80, "Rear Shoulders": 80, Traps: 25, Core: 10 }, equipment: "dumbbell", movementPattern: "shoulder health" }),

  ex({ name: "Bicep Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 20 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "elbow flexion" }),
  ex({ name: "Barbell Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 25, Core: 5 }, equipment: "barbell", movementPattern: "elbow flexion" }),
  ex({ name: "Dumbbell Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 20 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "elbow flexion" }),
  ex({ name: "Hammer Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps", "Forearms"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 85, Forearms: 70 }, equipment: "dumbbell", movementPattern: "elbow flexion" }),
  ex({ name: "Incline Dumbbell Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 15 }, equipment: "dumbbell", movementPattern: "elbow flexion" }),
  ex({ name: "Preacher Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 15 }, equipment: "machine", movementPattern: "elbow flexion" }),
  ex({ name: "Cable Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 20 }, equipment: "cable", movementPattern: "elbow flexion" }),
  ex({ name: "Concentration Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 15 }, equipment: "dumbbell", movementPattern: "elbow flexion" }),
  ex({ name: "EZ-Bar Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Biceps: 100, Forearms: 20 }, equipment: "ez bar", movementPattern: "elbow flexion" }),
  ex({ name: "Reverse Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Forearms", "Biceps"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Forearms: 100, Biceps: 55 }, equipment: "barbell", movementPattern: "elbow flexion" }),
  ex({ name: "Tricep Pushdown", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: [], stabiliserMuscles: ["Shoulders"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 10 }, equipment: "cable", difficulty: "Beginner", movementPattern: "elbow extension" }),
  ex({ name: "Rope Pushdown", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: [], stabiliserMuscles: ["Shoulders"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 10 }, equipment: "cable", difficulty: "Beginner", movementPattern: "elbow extension" }),
  ex({ name: "Overhead Tricep Extension", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 20, Core: 10 }, equipment: "dumbbell", movementPattern: "elbow extension" }),
  ex({ name: "Skull Crusher", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 15 }, equipment: "ez bar", movementPattern: "elbow extension" }),
  ex({ name: "Close-Grip Bench Press", category: "Arms", primaryMuscles: ["Triceps"], secondaryMuscles: ["Chest", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 10, impactProfile: { Triceps: 100, Chest: 55, "Front Shoulders": 35, Core: 10 }, equipment: "barbell", movementPattern: "horizontal press" }),
  ex({ name: "Tricep Dip", category: "Arms", exerciseType: "bodyweight", primaryMuscles: ["Triceps"], secondaryMuscles: ["Chest", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 6, defaultRepMax: 12, impactProfile: { Triceps: 100, Chest: 45, "Front Shoulders": 30, Core: 15 }, equipment: "bodyweight", movementPattern: "dip" }),
  ex({ name: "Cable Overhead Extension", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 20, Core: 10 }, equipment: "cable", movementPattern: "elbow extension" }),
  ex({ name: "Dumbbell Overhead Extension", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Triceps: 100, Shoulders: 20, Core: 10 }, equipment: "dumbbell", movementPattern: "elbow extension" }),
  ex({ name: "Machine Tricep Extension", category: "Arms", exerciseType: "machine", primaryMuscles: ["Triceps"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Triceps: 100 }, equipment: "machine", movementPattern: "elbow extension" }),
  ex({ name: "Diamond Push-Up", category: "Arms", exerciseType: "bodyweight", primaryMuscles: ["Triceps"], secondaryMuscles: ["Chest", "Front Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Triceps: 100, Chest: 50, "Front Shoulders": 30, Core: 20 }, equipment: "bodyweight", movementPattern: "horizontal press" }),

  ex({ name: "Plank", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: ["Shoulders", "Glutes"], stabiliserMuscles: [], defaultRepMin: 1, defaultRepMax: 3, overloadIncrementKg: 0, impactProfile: { Core: 100, Shoulders: 20, Glutes: 15 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "anti-extension" }),
  ex({ name: "Side Plank", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: ["Shoulders", "Glutes"], stabiliserMuscles: [], defaultRepMin: 1, defaultRepMax: 3, overloadIncrementKg: 0, impactProfile: { Core: 100, Shoulders: 20, Glutes: 20 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "anti-lateral flexion" }),
  ex({ name: "Hanging Leg Raise", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: ["Grip"], stabiliserMuscles: ["Shoulders"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { Core: 100, Grip: 30, Shoulders: 15 }, equipment: "bodyweight", difficulty: "Advanced", movementPattern: "hip flexion" }),
  ex({ name: "Cable Crunch", category: "Core", exerciseType: "isolation", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Core: 100 }, equipment: "cable", movementPattern: "spinal flexion" }),
  ex({ name: "Machine Crunch", category: "Core", exerciseType: "machine", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Core: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "spinal flexion" }),
  ex({ name: "Russian Twist", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: ["Hip Flexors"], defaultRepMin: 12, defaultRepMax: 24, overloadIncrementKg: 1, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "rotation" }),
  ex({ name: "Ab Wheel Rollout", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Glutes"], defaultRepMin: 6, defaultRepMax: 12, overloadIncrementKg: 0, impactProfile: { Core: 100, Shoulders: 25, Glutes: 15 }, equipment: "ab wheel", difficulty: "Advanced", movementPattern: "anti-extension" }),
  ex({ name: "Dead Bug", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 0, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "anti-extension" }),
  ex({ name: "Bicycle Crunch", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 12, defaultRepMax: 24, overloadIncrementKg: 0, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "rotation" }),
  ex({ name: "Mountain Climber", category: "Core", exerciseType: "cardio", primaryMuscles: ["Core", "Cardio"], secondaryMuscles: ["Shoulders", "Legs"], stabiliserMuscles: ["Glutes"], defaultRepMin: 20, defaultRepMax: 60, overloadIncrementKg: 0, impactProfile: { Core: 90, Cardio: 80, Shoulders: 25, Legs: 25, Glutes: 15 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "conditioning" }),
  ex({ name: "Reverse Crunch", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "spinal flexion" }),
  ex({ name: "Pallof Press", category: "Core", exerciseType: "isolation", primaryMuscles: ["Core"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Glutes"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Core: 100, Shoulders: 15, Glutes: 10 }, equipment: "cable", movementPattern: "anti-rotation" }),
  ex({ name: "Woodchopper", category: "Core", exerciseType: "isolation", primaryMuscles: ["Core"], secondaryMuscles: ["Shoulders"], stabiliserMuscles: ["Glutes"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Core: 100, Shoulders: 20, Glutes: 15 }, equipment: "cable", movementPattern: "rotation" }),
  ex({ name: "Hollow Hold", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 1, defaultRepMax: 3, overloadIncrementKg: 0, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "anti-extension" }),
  ex({ name: "Sit-Up", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Core"], secondaryMuscles: [], stabiliserMuscles: [], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Core: 100 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "spinal flexion" }),

  ex({ name: "Clean", category: "Full Body", primaryMuscles: ["Full Body", "Legs", "Back"], secondaryMuscles: ["Glutes", "Hamstrings", "Shoulders", "Traps", "Grip"], stabiliserMuscles: ["Core"], defaultRepMin: 2, defaultRepMax: 5, overloadIncrementKg: 2.5, impactProfile: { "Full Body": 100, Legs: 70, Back: 60, Glutes: 55, Hamstrings: 45, Shoulders: 35, Traps: 35, Grip: 30, Core: 35 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "power" }),
  ex({ name: "Power Clean", category: "Full Body", primaryMuscles: ["Full Body", "Legs", "Back"], secondaryMuscles: ["Glutes", "Hamstrings", "Shoulders", "Traps", "Grip"], stabiliserMuscles: ["Core"], defaultRepMin: 2, defaultRepMax: 5, overloadIncrementKg: 2.5, impactProfile: { "Full Body": 100, Legs: 70, Back: 60, Glutes: 55, Hamstrings: 45, Shoulders: 35, Traps: 35, Grip: 30, Core: 35 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "power" }),
  ex({ name: "Thruster", category: "Full Body", primaryMuscles: ["Full Body", "Legs", "Shoulders"], secondaryMuscles: ["Glutes", "Triceps", "Core", "Cardio"], stabiliserMuscles: ["Upper Back"], defaultRepMin: 6, defaultRepMax: 12, overloadIncrementKg: 2.5, impactProfile: { "Full Body": 100, Legs: 75, Shoulders: 65, Glutes: 45, Triceps: 35, Core: 35, Cardio: 45, "Upper Back": 15 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "squat to press" }),
  ex({ name: "Farmer's Walk", category: "Full Body", exerciseType: "bodyweight", primaryMuscles: ["Grip", "Core"], secondaryMuscles: ["Traps", "Legs", "Back"], stabiliserMuscles: ["Shoulders"], defaultRepMin: 1, defaultRepMax: 6, overloadIncrementKg: 5, impactProfile: { Grip: 100, Core: 70, Traps: 55, Legs: 30, Back: 25, Shoulders: 20 }, equipment: "dumbbell", movementPattern: "carry" }),
  ex({ name: "Burpee", category: "Full Body", exerciseType: "cardio", primaryMuscles: ["Full Body", "Cardio"], secondaryMuscles: ["Chest", "Legs", "Core", "Shoulders"], stabiliserMuscles: ["Glutes"], defaultRepMin: 8, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { "Full Body": 100, Cardio: 100, Chest: 35, Legs: 45, Core: 35, Shoulders: 25, Glutes: 25 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "conditioning" }),
  ex({ name: "Battle Ropes", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio", "Shoulders"], secondaryMuscles: ["Arms", "Core"], stabiliserMuscles: ["Legs"], defaultRepMin: 1, defaultRepMax: 8, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Shoulders: 70, Arms: 45, Core: 35, Legs: 15 }, equipment: "ropes", difficulty: "Beginner", movementPattern: "conditioning" }),

  ex({ name: "Treadmill Run", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Calves"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 45, Calves: 35, Core: 15 }, equipment: "treadmill", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Incline Walk", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Glutes", "Calves"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 40, Glutes: 35, Calves: 30, Core: 10 }, equipment: "treadmill", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Stationary Bike", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Quads"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 45, Quads: 40, Core: 10 }, equipment: "bike", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Rowing Machine", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio", "Back"], secondaryMuscles: ["Legs", "Biceps", "Core"], stabiliserMuscles: ["Glutes"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Back: 60, Legs: 45, Biceps: 25, Core: 25, Glutes: 20 }, equipment: "rower", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Stairmaster", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Glutes", "Calves"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 50, Glutes: 45, Calves: 35, Core: 15 }, equipment: "machine", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Elliptical", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Glutes"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 1, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 35, Glutes: 25, Core: 10 }, equipment: "machine", difficulty: "Beginner", movementPattern: "cardio" }),
  ex({ name: "Assault Bike", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Shoulders", "Arms"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 8, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 55, Shoulders: 35, Arms: 30, Core: 20 }, equipment: "bike", movementPattern: "conditioning" }),
  ex({ name: "Skipping Rope", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Calves", "Shoulders"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 8, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Calves: 55, Shoulders: 25, Core: 20 }, equipment: "rope", difficulty: "Beginner", movementPattern: "conditioning" }),
  ex({ name: "Sprint Intervals", category: "Cardio", exerciseType: "cardio", primaryMuscles: ["Cardio"], secondaryMuscles: ["Legs", "Glutes", "Hamstrings", "Calves"], stabiliserMuscles: ["Core"], defaultRepMin: 1, defaultRepMax: 10, overloadIncrementKg: 0, impactProfile: { Cardio: 100, Legs: 65, Glutes: 45, Hamstrings: 45, Calves: 45, Core: 20 }, equipment: "bodyweight", difficulty: "Advanced", movementPattern: "conditioning" })
];

const extraDetailedExercises = [
  ex({ name: "Cable Hip Abduction", category: "Glutes", exerciseType: "isolation", primaryMuscles: ["Abductors", "Glute Medius"], secondaryMuscles: ["Glute Minimus", "Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Abductors: 100, "Glute Medius": 90, "Glute Minimus": 65, Core: 20 }, equipment: "cable", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Banded Lateral Walk", category: "Glutes", exerciseType: "bodyweight", primaryMuscles: ["Abductors", "Glute Medius"], secondaryMuscles: ["Glute Minimus", "Quads"], defaultRepMin: 12, defaultRepMax: 30, overloadIncrementKg: 0, impactProfile: { Abductors: 90, "Glute Medius": 90, "Glute Minimus": 55, Quads: 25 }, equipment: "band", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Clamshell", category: "Glutes", exerciseType: "bodyweight", primaryMuscles: ["Abductors", "Glute Medius"], secondaryMuscles: ["Glute Minimus"], defaultRepMin: 12, defaultRepMax: 25, overloadIncrementKg: 0, impactProfile: { Abductors: 85, "Glute Medius": 90, "Glute Minimus": 60 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Side-Lying Hip Abduction", category: "Glutes", exerciseType: "bodyweight", primaryMuscles: ["Abductors", "Glute Medius"], secondaryMuscles: ["Glute Minimus", "Core"], defaultRepMin: 12, defaultRepMax: 25, overloadIncrementKg: 0, impactProfile: { Abductors: 100, "Glute Medius": 95, "Glute Minimus": 55, Core: 15 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Standing Hip Abduction", category: "Glutes", exerciseType: "isolation", primaryMuscles: ["Abductors", "Glute Medius"], secondaryMuscles: ["Glute Minimus", "Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Abductors: 95, "Glute Medius": 90, "Glute Minimus": 55, Core: 15 }, equipment: "cable", difficulty: "Beginner", movementPattern: "hip abduction" }),
  ex({ name: "Copenhagen Side Plank Variation", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Adductors", "Core"], secondaryMuscles: ["Abductors", "Obliques"], defaultRepMin: 1, defaultRepMax: 4, overloadIncrementKg: 0, impactProfile: { Adductors: 90, Core: 75, Abductors: 35, Obliques: 65 }, equipment: "bodyweight", difficulty: "Advanced", movementPattern: "anti-lateral flexion" }),
  ex({ name: "Lateral Lunge", category: "Legs", primaryMuscles: ["Quads", "Glutes", "Adductors"], secondaryMuscles: ["Abductors", "Hamstrings", "Core"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { Quads: 80, Glutes: 75, Adductors: 70, Abductors: 45, Hamstrings: 35, Core: 25 }, equipment: "dumbbell", difficulty: "Intermediate", movementPattern: "lateral lunge" }),
  ex({ name: "Hip Adduction Machine", category: "Legs", exerciseType: "machine", primaryMuscles: ["Adductors"], secondaryMuscles: ["Quads", "Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Adductors: 100, Quads: 25, Core: 10 }, equipment: "machine", difficulty: "Beginner", movementPattern: "hip adduction" }),
  ex({ name: "Cable Hip Adduction", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Adductors"], secondaryMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { Adductors: 100, Core: 20 }, equipment: "cable", difficulty: "Beginner", movementPattern: "hip adduction" }),
  ex({ name: "Copenhagen Plank", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Adductors", "Core"], secondaryMuscles: ["Obliques"], defaultRepMin: 1, defaultRepMax: 4, overloadIncrementKg: 0, impactProfile: { Adductors: 100, Core: 80, Obliques: 65 }, equipment: "bodyweight", difficulty: "Advanced", movementPattern: "anti-lateral flexion" }),
  ex({ name: "Sumo Squat", category: "Legs", primaryMuscles: ["Quads", "Glutes", "Adductors"], secondaryMuscles: ["Hamstrings", "Core"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { Quads: 80, Glutes: 75, Adductors: 70, Hamstrings: 40, Core: 25 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "squat" }),
  ex({ name: "Cossack Squat", category: "Legs", exerciseType: "bodyweight", primaryMuscles: ["Adductors", "Quads", "Glutes"], secondaryMuscles: ["Hamstrings", "Abductors", "Core"], defaultRepMin: 6, defaultRepMax: 12, overloadIncrementKg: 0, impactProfile: { Adductors: 90, Quads: 75, Glutes: 65, Hamstrings: 35, Abductors: 35, Core: 30 }, equipment: "bodyweight", difficulty: "Intermediate", movementPattern: "lateral squat" }),
  ex({ name: "Wide-Stance Leg Press", category: "Legs", exerciseType: "machine", primaryMuscles: ["Quads", "Glutes", "Adductors"], secondaryMuscles: ["Hamstrings"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 5, impactProfile: { Quads: 85, Glutes: 75, Adductors: 65, Hamstrings: 35 }, equipment: "machine", difficulty: "Beginner", movementPattern: "squat" }),
  ex({ name: "Tibialis Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Tibialis"], secondaryMuscles: ["Calves"], defaultRepMin: 12, defaultRepMax: 25, overloadIncrementKg: 1, impactProfile: { Tibialis: 100, Calves: 15 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "ankle dorsiflexion" }),
  ex({ name: "Seated Tibialis Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Tibialis"], defaultRepMin: 12, defaultRepMax: 25, overloadIncrementKg: 1, impactProfile: { Tibialis: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "ankle dorsiflexion" }),
  ex({ name: "Standing Calf Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Calves"], secondaryMuscles: ["Tibialis"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Calves: 100, Tibialis: 15 }, equipment: "machine", difficulty: "Beginner", movementPattern: "calf raise" }),
  ex({ name: "Donkey Calf Raise", category: "Legs", exerciseType: "isolation", primaryMuscles: ["Calves"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 2.5, impactProfile: { Calves: 100 }, equipment: "machine", difficulty: "Beginner", movementPattern: "calf raise" }),
  ex({ name: "Single-Leg Calf Raise", category: "Legs", exerciseType: "bodyweight", primaryMuscles: ["Calves"], secondaryMuscles: ["Tibialis", "Core"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Calves: 100, Tibialis: 10, Core: 15 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "calf raise" }),
  ex({ name: "Hanging Knee Raise", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Hip Flexors", "Abs"], secondaryMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { "Hip Flexors": 85, Abs: 75, Core: 80 }, equipment: "bodyweight", difficulty: "Intermediate", movementPattern: "hip flexion" }),
  ex({ name: "Captain's Chair Knee Raise", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Hip Flexors", "Abs"], secondaryMuscles: ["Core"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { "Hip Flexors": 85, Abs: 75, Core: 80 }, equipment: "machine", difficulty: "Beginner", movementPattern: "hip flexion" }),
  ex({ name: "Cable Knee Drive", category: "Core", exerciseType: "isolation", primaryMuscles: ["Hip Flexors"], secondaryMuscles: ["Abs", "Core"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Hip Flexors": 100, Abs: 35, Core: 35 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "hip flexion" }),
  ex({ name: "Standing Band Hip Flexion", category: "Core", exerciseType: "isolation", primaryMuscles: ["Hip Flexors"], secondaryMuscles: ["Core"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { "Hip Flexors": 100, Core: 20 }, equipment: "band", difficulty: "Beginner", movementPattern: "hip flexion" }),
  ex({ name: "Lying Leg Raise", category: "Core", exerciseType: "bodyweight", primaryMuscles: ["Abs", "Hip Flexors"], defaultRepMin: 8, defaultRepMax: 20, overloadIncrementKg: 0, impactProfile: { Abs: 85, "Hip Flexors": 70, Core: 85 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "hip flexion" }),
  ex({ name: "Cable External Rotation", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Rotator Cuff"], secondaryMuscles: ["Rear Delts"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rotator Cuff": 100, "Rear Delts": 25 }, equipment: "cable", difficulty: "Beginner", movementPattern: "external rotation" }),
  ex({ name: "Dumbbell External Rotation", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Rotator Cuff"], secondaryMuscles: ["Rear Delts"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rotator Cuff": 100, "Rear Delts": 20 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "external rotation" }),
  ex({ name: "Cable Internal Rotation", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Rotator Cuff"], secondaryMuscles: ["Front Delts"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rotator Cuff": 100, "Front Delts": 15 }, equipment: "cable", difficulty: "Beginner", movementPattern: "internal rotation" }),
  ex({ name: "Band Pull-Apart", category: "Back", exerciseType: "isolation", primaryMuscles: ["Rear Delts", "Upper Back"], secondaryMuscles: ["Rotator Cuff", "Rhomboids", "Traps"], defaultRepMin: 15, defaultRepMax: 30, overloadIncrementKg: 0, impactProfile: { "Rear Delts": 80, "Upper Back": 75, "Rotator Cuff": 45, Rhomboids: 60, Traps: 35 }, equipment: "band", difficulty: "Beginner", movementPattern: "rear delt pull" }),
  ex({ name: "Chest-Supported Dumbbell Row", category: "Back", primaryMuscles: ["Mid Back", "Rhomboids", "Lats"], secondaryMuscles: ["Rear Delts", "Biceps", "Brachialis"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2, impactProfile: { "Mid Back": 100, Rhomboids: 85, Lats: 65, "Rear Delts": 45, Biceps: 35, Brachialis: 25 }, equipment: "dumbbell", difficulty: "Intermediate", movementPattern: "horizontal pull" }),
  ex({ name: "Wide-Grip Lat Pulldown", category: "Back", exerciseType: "machine", primaryMuscles: ["Lats", "Teres Major"], secondaryMuscles: ["Upper Back", "Biceps", "Brachialis"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 2.5, impactProfile: { Lats: 100, "Teres Major": 75, "Upper Back": 40, Biceps: 35, Brachialis: 25 }, equipment: "cable", difficulty: "Beginner", movementPattern: "vertical pull" }),
  ex({ name: "One-Arm Cable Row", category: "Back", exerciseType: "machine", primaryMuscles: ["Lats", "Mid Back"], secondaryMuscles: ["Rhomboids", "Biceps", "Rear Delts"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { Lats: 90, "Mid Back": 80, Rhomboids: 60, Biceps: 35, "Rear Delts": 35 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "horizontal pull" }),
  ex({ name: "Scapular Pull-Up", category: "Back", exerciseType: "bodyweight", primaryMuscles: ["Lats", "Lower Traps", "Teres Major"], secondaryMuscles: ["Grip"], defaultRepMin: 6, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { Lats: 75, "Lower Traps": 70, "Teres Major": 60, Grip: 35 }, equipment: "bodyweight", difficulty: "Intermediate", movementPattern: "scapular pull" }),
  ex({ name: "Inverted Row", category: "Back", exerciseType: "bodyweight", primaryMuscles: ["Mid Back", "Rhomboids", "Lats"], secondaryMuscles: ["Rear Delts", "Biceps", "Core"], defaultRepMin: 8, defaultRepMax: 15, overloadIncrementKg: 0, impactProfile: { "Mid Back": 85, Rhomboids: 75, Lats: 65, "Rear Delts": 45, Biceps: 40, Core: 30 }, equipment: "bodyweight", difficulty: "Beginner", movementPattern: "horizontal pull" }),
  ex({ name: "Incline Cable Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Upper Chest"], secondaryMuscles: ["Front Delts"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Upper Chest": 100, Chest: 75, "Front Delts": 25 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "fly" }),
  ex({ name: "Decline Cable Fly", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Lower Chest"], secondaryMuscles: ["Chest"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Lower Chest": 100, Chest: 75 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "fly" }),
  ex({ name: "Machine Fly", category: "Chest", exerciseType: "machine", primaryMuscles: ["Mid Chest", "Inner Chest"], secondaryMuscles: ["Front Delts"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { "Mid Chest": 90, "Inner Chest": 75, "Front Delts": 20 }, equipment: "machine", difficulty: "Beginner", movementPattern: "fly" }),
  ex({ name: "Svend Press", category: "Chest", exerciseType: "isolation", primaryMuscles: ["Inner Chest"], secondaryMuscles: ["Front Delts", "Triceps"], defaultRepMin: 10, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Inner Chest": 85, Chest: 60, "Front Delts": 30, Triceps: 20 }, equipment: "plate", difficulty: "Beginner", movementPattern: "squeeze press" }),
  ex({ name: "Guillotine Press", category: "Chest", primaryMuscles: ["Upper Chest", "Mid Chest"], secondaryMuscles: ["Front Delts", "Triceps"], defaultRepMin: 6, defaultRepMax: 10, overloadIncrementKg: 2.5, impactProfile: { "Upper Chest": 85, "Mid Chest": 80, "Front Delts": 50, Triceps: 25 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "horizontal press" }),
  ex({ name: "Spider Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps Short Head"], secondaryMuscles: ["Biceps", "Brachialis"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Biceps Short Head": 100, Biceps: 85, Brachialis: 35 }, equipment: "dumbbell", difficulty: "Intermediate", movementPattern: "elbow flexion" }),
  ex({ name: "Bayesian Cable Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps Long Head"], secondaryMuscles: ["Biceps", "Forearms"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Biceps Long Head": 100, Biceps: 85, Forearms: 20 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "elbow flexion" }),
  ex({ name: "Cross-Body Hammer Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Brachialis", "Brachioradialis"], secondaryMuscles: ["Biceps", "Forearms"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Brachialis: 100, Brachioradialis: 95, Biceps: 45, Forearms: 50 }, equipment: "dumbbell", difficulty: "Beginner", movementPattern: "elbow flexion" }),
  ex({ name: "Zottman Curl", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Biceps", "Brachioradialis"], secondaryMuscles: ["Brachialis", "Forearms"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { Biceps: 80, Brachioradialis: 85, Brachialis: 65, Forearms: 70 }, equipment: "dumbbell", difficulty: "Intermediate", movementPattern: "elbow flexion" }),
  ex({ name: "Single-Arm Rope Pushdown", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps Lateral Head", "Triceps Medial Head"], secondaryMuscles: ["Triceps"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Triceps Lateral Head": 85, "Triceps Medial Head": 70, Triceps: 100 }, equipment: "cable", difficulty: "Beginner", movementPattern: "elbow extension" }),
  ex({ name: "Cross-Body Cable Tricep Extension", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps Lateral Head"], secondaryMuscles: ["Triceps"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Triceps Lateral Head": 100, Triceps: 80 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "elbow extension" }),
  ex({ name: "Incline Skull Crusher", category: "Arms", exerciseType: "isolation", primaryMuscles: ["Triceps Long Head"], secondaryMuscles: ["Triceps"], defaultRepMin: 8, defaultRepMax: 12, overloadIncrementKg: 1, impactProfile: { "Triceps Long Head": 100, Triceps: 85 }, equipment: "ez bar", difficulty: "Intermediate", movementPattern: "elbow extension" }),
  ex({ name: "JM Press", category: "Arms", primaryMuscles: ["Triceps", "Triceps Medial Head"], secondaryMuscles: ["Chest", "Front Delts"], defaultRepMin: 6, defaultRepMax: 10, overloadIncrementKg: 2.5, impactProfile: { Triceps: 100, "Triceps Medial Head": 70, Chest: 35, "Front Delts": 30 }, equipment: "barbell", difficulty: "Advanced", movementPattern: "press extension" }),
  ex({ name: "Machine Lateral Raise", category: "Shoulders", exerciseType: "machine", primaryMuscles: ["Side Delts"], secondaryMuscles: ["Traps"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 2.5, impactProfile: { "Side Delts": 100, Traps: 15 }, equipment: "machine", difficulty: "Beginner", movementPattern: "lateral raise" }),
  ex({ name: "Leaning Cable Lateral Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Side Delts"], secondaryMuscles: ["Traps"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Side Delts": 100, Traps: 15 }, equipment: "cable", difficulty: "Intermediate", movementPattern: "lateral raise" }),
  ex({ name: "Rear Delt Cable Fly", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Rear Delts"], secondaryMuscles: ["Upper Back", "Rhomboids"], defaultRepMin: 12, defaultRepMax: 20, overloadIncrementKg: 1, impactProfile: { "Rear Delts": 100, "Upper Back": 35, Rhomboids: 30 }, equipment: "cable", difficulty: "Beginner", movementPattern: "rear delt fly" }),
  ex({ name: "Y-Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Lower Traps", "Rear Delts"], secondaryMuscles: ["Rotator Cuff"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Lower Traps": 85, "Rear Delts": 55, "Rotator Cuff": 35 }, equipment: "dumbbell", difficulty: "Intermediate", movementPattern: "shoulder health" }),
  ex({ name: "Plate Front Raise", category: "Shoulders", exerciseType: "isolation", primaryMuscles: ["Front Delts"], secondaryMuscles: ["Upper Chest"], defaultRepMin: 10, defaultRepMax: 15, overloadIncrementKg: 1, impactProfile: { "Front Delts": 100, "Upper Chest": 20 }, equipment: "plate", difficulty: "Beginner", movementPattern: "front raise" })
];

export const seedExercises = async () => {
  const allExercises = [...defaultExercises, ...extraDetailedExercises];
  const operations = allExercises.map((exercise) => ({
    updateOne: {
      filter: { name: exercise.name },
      update: { $set: exercise },
      upsert: true
    }
  }));

  const result = await Exercise.bulkWrite(operations);
  return {
    totalDefaultExercises: allExercises.length,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    matched: result.matchedCount
  };
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await connectDB();
    const result = await seedExercises();
    console.log("Exercise seed complete:", result);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Exercise seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}
