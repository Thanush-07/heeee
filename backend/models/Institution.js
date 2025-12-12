// models/Institution.js
import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    institution_id: { type: String, required: true, unique: true },
    location: { type: String },
    maxBranches: {
      type: Number,
      default: 7,          // company default
      min: 1,
      max: 7               // hard cap at 7
    },
    logo: {
      data: Buffer,
      contentType: String
    }
  },
  { timestamps: true }
);

export const Institution = mongoose.model("Institution", institutionSchema);
