// models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    institution_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
