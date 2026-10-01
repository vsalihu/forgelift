import mongoose from "mongoose";

export const REPORT_REASONS = ["fake_lifts", "inappropriate_profile", "harassment", "spam", "other"];

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
