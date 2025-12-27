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
    },
    class: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    rollNo: {
      type: String,
      required: true
    },
    parentName: {
      type: String,
      required: true
    },
    phoneNo: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    admissionNumber: {
      type: String,
      required: true,
      unique: true
    },
    academicYear: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    fees: {
      type: Number,
      default: null
    },
    residency: {
      type: String,
      enum: ["hosteller", "day-scholar"],
      default: "hosteller"
    },
    busFees: {
      type: Number,
      default: null
    },
    hostelFees: {
      type: Number,
      default: null
    },
    emisNo: {
      type: String,
      default: null
    },
    motherName: {
      type: String,
      default: null
    },
    fatherName: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "left", "transferred"],
      default: "active"
    },
    image: {
      type: String,
      default: null
    },
    aadharCardNumber: {
      type: String,
      default: null
    },
    rationCardNumber: {
      type: String,
      default: null
    },
    customNote: {
      type: String,
      default: null
    },
    customFields: [
      {
        key: String,
        value: String
      }
    ]
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
