// models/FeePayment.js
import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
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
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    studentName: {
      type: String,
    },
    class: {
      type: String,
    },
    category: {
      type: String,
    },
    amount: {
      type: Number,
      required: true
    },
    mode: {
      type: String,
    },
    note: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
