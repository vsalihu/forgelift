import mongoose from "mongoose";

const bodyMeasurementsSchema = new mongoose.Schema(
  {
    chest: Number,
    waist: Number,
    hips: Number,
    shoulders: Number,
    arms: Number,
    thighs: Number,
    calves: Number,
    glutes: Number
  },
  { _id: false }
);

const strengthBaselineSchema = new mongoose.Schema(
  {
    exerciseName: {
      type: String,
      required: true,
      trim: true
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise"
    },
    estimatedOneRepMax: {
      type: Number,
      default: 0
    },
    workingWeight: {
      type: Number,
      default: 0
    },
    reps: {
      type: Number,
      default: 1
    },
    suggestedWorkingWeight: {
      type: Number,
      default: 0
    },
    suggestedRepRange: {
      type: String,
      default: ""
    },
    confidence: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    source: {
      type: String,
      enum: ["user_entered", "estimated_from_baseline", "workout_history"],
      default: "user_entered"
    },
    sourceExerciseName: {
      type: String,
      default: ""
    },
    ratioUsed: {
      type: Number,
      default: 1
    },
    note: {
      type: String,
      default: ""
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say", "custom", ""],
      default: ""
    },
    customGenderLabel: {
      type: String,
      trim: true,
      default: ""
    },
    selectedStrengthStandard: {
      type: String,
      enum: ["male", "female", "neutral", ""],
      default: ""
    },
    age: Number,
    height: Number,
    bodyweight: Number,
    lastBodyweightCheckInAt: Date,
    bodyweightCheckInReminderEnabled: {
      type: Boolean,
      default: true
    },
    bodyweightCheckInDay: {
      type: String,
      default: "Monday"
    },
    preferredUnits: {
      type: String,
      enum: ["metric", "imperial", ""],
      default: "metric"
    },
    trainingExperience: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", ""],
      default: ""
    },
    goalPath: {
      type: String,
      default: ""
    },
    bodyMeasurements: {
      type: bodyMeasurementsSchema,
      default: {}
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    xp: {
      type: Number,
      default: 0
    },
    overallRankScore: {
      type: Number,
      default: 0
    },
    currentOverallRank: {
      type: String,
      default: "Copper"
    },
    lastRankCheck: {
      type: Date
    },
    overloadMode: {
      type: String,
      enum: ["Conservative", "Balanced", "Aggressive"],
      default: "Balanced"
    },
    strengthBaselines: {
      type: [strengthBaselineSchema],
      default: []
    },
    strengthBaselineUpdatedAt: {
      type: Date
    },
    beginnerTipsEnabled: {
      type: Boolean,
      default: true
    },
    assessmentCompleted: {
      type: Boolean,
      default: false
    },
    assessmentCompletedAt: {
      type: Date
    },
    assessmentSkippedAt: {
      type: Date
    },
    assessmentVersion: {
      type: Number,
      default: 1
    },
    assessmentSummary: {
      determinedLevel: {
        type: String,
        default: ""
      },
      confidence: {
        type: String,
        default: ""
      },
      mainGoal: {
        type: String,
        default: ""
      },
      trainingAgeMonths: {
        type: Number,
        default: 0
      },
      weeklyTrainingFrequency: {
        type: Number,
        default: 0
      },
      strongestLift: {
        type: String,
        default: ""
      },
      weakestArea: {
        type: String,
        default: ""
      },
      recommendationSummary: {
        type: String,
        default: ""
      }
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
