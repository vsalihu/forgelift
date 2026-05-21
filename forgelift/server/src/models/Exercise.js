import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
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
    exerciseType: {
      type: String,
      enum: ["compound", "isolation", "machine", "bodyweight", "cardio"],
      default: "compound"
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
    defaultRepMin: {
      type: Number,
      default: 1
    },
    defaultRepMax: {
      type: Number,
      default: 1
    },
    overloadIncrementKg: {
      type: Number,
      default: 0
    },
    impactProfile: {
      type: Object,
      default: {}
    },
    instructions: {
      type: String,
      trim: true,
      default: ""
    },
    equipment: {
      type: String,
      trim: true,
      default: ""
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", ""],
      default: ""
    },
    movementPattern: {
      type: String,
      trim: true,
      default: ""
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private"
    }
  },
  { timestamps: true }
);

exerciseSchema.index({ name: 1 }, { unique: true });
exerciseSchema.index({ createdBy: 1, isCustom: 1 });

export default mongoose.model("Exercise", exerciseSchema);
