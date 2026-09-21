import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending"
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export default mongoose.model("Friendship", friendshipSchema);
