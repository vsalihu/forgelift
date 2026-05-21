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
