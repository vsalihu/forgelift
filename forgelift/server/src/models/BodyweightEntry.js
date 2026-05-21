import mongoose from "mongoose";

const bodyweightEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    weight: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ["kg", "lb"],
      default: "kg"
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      enum: ["manual", "weekly_prompt", "profile_update"],
      default: "manual"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

bodyweightEntrySchema.index({ userId: 1, recordedAt: -1 });

export default mongoose.model("BodyweightEntry", bodyweightEntrySchema);
