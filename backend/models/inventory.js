// inventory_models.js
// Combined inventory models for easy migration

import mongoose from "mongoose";

// InventoryItem Model
const InventoryItemSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pieces",
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
InventoryItemSchema.index({ branch_id: 1, category: 1 });
InventoryItemSchema.index({ branch_id: 1, name: 1 });

export const InventoryItem = mongoose.model("InventoryItem", InventoryItemSchema);

// PurchaseEntry Model
const PurchaseEntrySchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
PurchaseEntrySchema.index({ branch_id: 1, purchaseDate: -1 });
PurchaseEntrySchema.index({ item_id: 1 });

export const PurchaseEntry = mongoose.model("PurchaseEntry", PurchaseEntrySchema);

// StockTransfer Model
const StockTransferSchema = new mongoose.Schema(
  {
    fromBranch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    toBranch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
StockTransferSchema.index({ fromBranch_id: 1, status: 1 });
StockTransferSchema.index({ toBranch_id: 1, status: 1 });
StockTransferSchema.index({ item_id: 1 });

export const StockTransfer = mongoose.model("StockTransfer", StockTransferSchema);

// StockAdjustment Model
const StockAdjustmentSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ["damage", "expiry", "disposal", "other", "opening_stock"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adjustmentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
StockAdjustmentSchema.index({ branch_id: 1, adjustmentDate: -1 });
StockAdjustmentSchema.index({ item_id: 1 });

export const StockAdjustment = mongoose.model("StockAdjustment", StockAdjustmentSchema);

// StockMovement Model
const StockMovementSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    movementType: {
      type: String,
      enum: ["purchase", "transfer_in", "transfer_out", "adjustment", "opening_stock"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    movementDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
StockMovementSchema.index({ branch_id: 1, movementDate: -1 });
StockMovementSchema.index({ item_id: 1 });
StockMovementSchema.index({ referenceType: 1, referenceId: 1 });

export const StockMovement = mongoose.model("StockMovement", StockMovementSchema);