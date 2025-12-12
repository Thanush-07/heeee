// models/Branch.js
import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    institution_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true
    },
    branch_name: { type: String, required: true },
    location: { type: String }
  },
  { timestamps: true }
);

export const Branch = mongoose.model("Branch", branchSchema);
