import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    institution_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ branch_id: 1, date: -1 });
ExpenseSchema.index({ branch_id: 1, createdAt: -1 });

export const Expense = mongoose.model("Expense", ExpenseSchema);
