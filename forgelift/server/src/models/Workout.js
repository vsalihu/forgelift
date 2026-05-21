import mongoose from "mongoose";

const workoutSetSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      default: 0
    },
    reps: {
      type: Number,
      default: 1
    },
    rpe: Number,
    completed: {
      type: Boolean,
      default: true
    },
    setVolume: {
      type: Number,
      default: 0
    },
    estimated1RM: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    bodyweightOnly: {
      type: Boolean,
      default: false
    },
    bodyweightUsed: {
      type: Number,
      default: null
    },
    addedLoad: {
      type: Number,
      default: null
    },
    totalLoad: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise"
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true
    },
    exerciseType: {
      type: String,
      trim: true,
      default: ""
    },
    mainMuscleGroups: {
      type: [String],
      default: []
    },
    detailedMuscles: {
      type: [String],
      default: []
    },
    primaryMuscles: {
      type: [String],
      default: []
    },
    secondaryMuscles: {
      type: [String],
      default: []
    },
    stabiliserMuscles: {
      type: [String],
      default: []
    },
    impactProfile: {
      type: Object,
      default: {}
    },
    sets: {
      type: [workoutSetSchema],
      default: []
    },
    exerciseTotalVolume: {
      type: Number,
      default: 0
    },
    exerciseTotalReps: {
      type: Number,
      default: 0
    },
    exerciseTotalSets: {
      type: Number,
      default: 0
    },
    exerciseBestEstimated1RM: {
      type: Number,
      default: 0
    },
    exerciseAverageRPE: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: "Workout"
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    sessionRPE: Number,
    soreness: Number,
    sleepQuality: Number,
    energyLevel: Number,
    exercises: {
      type: [workoutExerciseSchema],
      default: []
    },
    totalVolume: {
      type: Number,
      default: 0
    },
    totalSets: {
      type: Number,
      default: 0
    },
    totalReps: {
      type: Number,
      default: 0
    },
    averageRPE: {
      type: Number,
      default: 0
    },
    heaviestWeight: {
      type: Number,
      default: 0
    },
    bestEstimated1RM: {
      type: Number,
      default: 0
    },
    completedSetCount: {
      type: Number,
      default: 0
    },
    failedSetCount: {
      type: Number,
      default: 0
    },
    muscleVolumeSummary: {
      type: Object,
      default: {}
    },
    muscleLoadSummary: {
      type: Object,
      default: {}
    },
    groupedMuscleLoadSummary: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("Workout", workoutSchema);
