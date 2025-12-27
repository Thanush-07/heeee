// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "company_admin",
        "institution_admin",
        "branch_admin",
        "staff",
        "parent"
      ],
      required: true
    },
    institution_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution"
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    resetToken: String,
    resetTokenExpiry: Date,
    // Staff-specific fields
    staffCategory: {
      type: String,
      required: function() { return this.role === "staff"; }
    },
    age: {
      type: Number,
      min: 18,
      max: 70,
      required: function() { return this.role === "staff"; }
    },
    address: {
      type: String,
      required: function() { return this.role === "staff"; }
    },
    location: {
      type: String,
      required: function() { return this.role === "staff"; }
    },
    // classes assigned to teaching staff (e.g. ["8A","9B"]) 
    classes: {
      type: [String],
      default: []
    },
    // subcategory/detail for non-teaching or custom categories
    staffSubcategory: {
      type: String,
      trim: true
    },
    photo: {
      data: Buffer,
      contentType: String
    }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  this.password_hash = await bcrypt.hash(plain, 10);
};

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

export const User = mongoose.model("User", userSchema);
