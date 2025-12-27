// inventory_routes.js
// Separate routes file for inventory module

import express from "express";
import mongoose from "mongoose";
import { InventoryItem, PurchaseEntry, StockTransfer, StockAdjustment, StockMovement } from "../models/inventory.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";

const router = express.Router();

// Helper function to update stock and create movement record
async function updateStockAndCreateMovement(
  branchId,
  itemId,
  quantity,
  movementType,
  referenceType,
  referenceId,
  notes = ""
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update inventory item stock
    const item = await InventoryItem.findByIdAndUpdate(
      itemId,
      { $inc: { currentStock: quantity } },
      { new: true, session }
    );

    if (!item) {
      throw new Error("Item not found");
    }

    // Ensure stock doesn't go negative
    if (item.currentStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    // Create movement record
    const movement = new StockMovement({
      branch_id: branchId,
      item_id: itemId,
      movementType,
      quantity,
      referenceType,
      referenceId,
      notes,
    });

    await movement.save({ session });

    await session.commitTransaction();
    return { item, movement };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/* ================= ITEMS MANAGEMENT ================= */

// GET /api/inventory/items?branchId=...
router.get("/items", async (req, res) => {
  try {
    const { branchId, category } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const filter = { branch_id: branchId };
    if (category) {
      filter.category = category;
    }

    const items = await InventoryItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    // Add low stock flag
    const itemsWithStatus = items.map((item) => ({
      ...item,
      isLowStock: item.currentStock < item.minQuantity,
    }));

    res.json(itemsWithStatus);
  } catch (err) {
    console.error("GET ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to load items" });
  }
});

// GET /api/inventory/items/low-stock?branchId=...
router.get("/items/low-stock", async (req, res) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const items = await InventoryItem.find({
      branch_id: branchId,
      $expr: { $lt: ["$currentStock", "$minQuantity"] },
    })
      .sort({ category: 1, name: 1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("GET LOW STOCK ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to load low stock items" });
  }
});

// POST /api/inventory/items
router.post("/items", async (req, res) => {
  try {
    const { branch_id, category, name, description, minQuantity, unit } =
      req.body;

    if (!branch_id || !category || !name) {
      return res
        .status(400)
        .json({ message: "branch_id, category, and name are required" });
    }

    // Sanitize category
    const sanitizedCategory = String(category).trim();

    const item = new InventoryItem({
      branch_id,
      category: sanitizedCategory,
      name,
      description: description || "",
      minQuantity: minQuantity || 0,
      unit: unit || "pieces",
      currentStock: 0,
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error("CREATE ITEM ERROR:", err);
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create item" });
  }
});

// PUT /api/inventory/items/:id
router.put("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, minQuantity, unit } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (minQuantity !== undefined) update.minQuantity = minQuantity;
    if (unit !== undefined) update.unit = unit;

    const item = await InventoryItem.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("UPDATE ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to update item" });
  }
});

/* ================= PURCHASE ENTRIES ================= */

// GET /api/inventory/purchases?branchId=...&itemId=...&startDate=...&endDate=...
router.get("/purchases", async (req, res) => {
  try {
    const { branchId, itemId, startDate, endDate } = req.query;

    const filter = {};
    if (branchId) filter.branch_id = branchId;
    if (itemId) filter.item_id = itemId;
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    const purchases = await PurchaseEntry.find(filter)
      .populate("item_id", "name category unit")
      .sort({ purchaseDate: -1, createdAt: -1 })
      .limit(100);

    res.json(purchases);
  } catch (err) {
    console.error("GET PURCHASES ERROR:", err);
    res.status(500).json({ message: "Failed to load purchases" });
  }
});

// POST /api/inventory/purchases
router.post("/purchases", async (req, res) => {
  try {
    const {
      branch_id,
      item_id,
      quantity,
      supplierName,
      invoiceNumber,
      purchaseDate,
      notes,
    } = req.body;

    if (!branch_id || !item_id || !quantity || !supplierName) {
      return res
        .status(400)
        .json({
          message:
            "branch_id, item_id, quantity, and supplierName are required",
        });
    }

    // Verify item belongs to branch
    const item = await InventoryItem.findOne({
      _id: item_id,
      branch_id: branch_id,
    });

    if (!item) {
      return res
        .status(400)
        .json({ message: "Item not found or does not belong to branch" });
    }

    // Create purchase entry
    const purchase = new PurchaseEntry({
      branch_id,
      item_id,
      quantity,
      supplierName,
      invoiceNumber: invoiceNumber || "",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes: notes || "",
    });

    await purchase.save();

    // Update stock and create movement
    await updateStockAndCreateMovement(
      branch_id,
      item_id,
      quantity,
      "purchase",
      "PurchaseEntry",
      purchase._id,
      `Purchase from ${supplierName}${invoiceNumber ? ` (Invoice: ${invoiceNumber})` : ""}`
    );

    const populated = await PurchaseEntry.findById(purchase._id).populate(
      "item_id",
      "name category unit"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE PURCHASE ERROR:", err);
    if (err.message === "Stock cannot be negative") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create purchase entry" });
  }
});

/* ================= STOCK TRANSFERS ================= */

// GET /api/inventory/transfers?branchId=...&status=...
router.get("/transfers", async (req, res) => {
  try {
    const { branchId, status } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const filter = {
      $or: [{ fromBranch_id: branchId }, { toBranch_id: branchId }],
    };
    if (status) {
      filter.status = status;
    }

    const transfers = await StockTransfer.find(filter)
      .populate("fromBranch_id", "branch_name")
      .populate("toBranch_id", "branch_name")
      .populate("item_id", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ requestDate: -1, createdAt: -1 })
      .limit(100);

    res.json(transfers);
  } catch (err) {
    console.error("GET TRANSFERS ERROR:", err);
    res.status(500).json({ message: "Failed to load transfers" });
  }
});

// POST /api/inventory/transfers
router.post("/transfers", async (req, res) => {
  try {
    const { fromBranch_id, toBranch_id, item_id, itemName, itemCategory, quantity, notes, requestedBy } =
      req.body;

    if (!fromBranch_id || !toBranch_id || !quantity || !requestedBy) {
      return res.status(400).json({
        message:
          "fromBranch_id, toBranch_id, quantity, and requestedBy are required",
      });
    }

    if (!item_id && (!itemName || !itemCategory)) {
      return res.status(400).json({
        message: "Either item_id or (itemName and itemCategory) are required",
      });
    }

    if (fromBranch_id === toBranch_id) {
      return res
        .status(400)
        .json({ message: "Cannot transfer to the same branch" });
    }

    // Verify both branches belong to same institution
    const [fromBranch, toBranch] = await Promise.all([
      Branch.findById(fromBranch_id),
      Branch.findById(toBranch_id),
    ]);

    if (!fromBranch || !toBranch) {
      return res.status(400).json({ message: "One or both branches not found" });
    }

    if (
      String(fromBranch.institution_id) !== String(toBranch.institution_id)
    ) {
      return res
        .status(400)
        .json({
          message: "Branches must belong to the same institution",
        });
    }

    // Find item in source branch
    let item;
    if (item_id) {
      item = await InventoryItem.findOne({
        _id: item_id,
        branch_id: fromBranch_id,
      });
    } else {
      item = await InventoryItem.findOne({
        branch_id: fromBranch_id,
        name: itemName,
        category: itemCategory,
      });
    }

    if (!item) {
      return res
        .status(400)
        .json({
          message: "Item not found in source branch",
        });
    }

    // Check if source branch has enough stock
    if (item.currentStock < quantity) {
      return res
        .status(400)
        .json({
          message: `Insufficient stock. Available: ${item.currentStock}`,
        });
    }

    // Create transfer request
    const transfer = new StockTransfer({
      fromBranch_id,
      toBranch_id,
      item_id: item._id,
      quantity,
      status: "pending",
      requestedBy,
      requestDate: new Date(),
      notes: notes || "",
    });

    await transfer.save();

    const populated = await StockTransfer.findById(transfer._id)
      .populate("fromBranch_id", "branch_name")
      .populate("toBranch_id", "branch_name")
      .populate("item_id", "name category unit")
      .populate("requestedBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE TRANSFER ERROR:", err);
    res.status(500).json({ message: "Failed to create transfer request" });
  }
});

// PUT /api/inventory/transfers/:id/approve
router.put("/transfers/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ message: "approvedBy is required" });
    }

    const transfer = await StockTransfer.findById(id);

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    if (transfer.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Transfer is not in pending status" });
    }

    // Verify item still has enough stock
    const item = await InventoryItem.findById(transfer.item_id);
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }

    if (item.currentStock < transfer.quantity) {
      return res
        .status(400)
        .json({
          message: `Insufficient stock. Available: ${item.currentStock}`,
        });
    }

    // Update transfer status
    transfer.status = "approved";
    transfer.approvedBy = approvedBy;
    await transfer.save();

    // Deduct from source branch
    await updateStockAndCreateMovement(
      transfer.fromBranch_id,
      transfer.item_id,
      -transfer.quantity,
      "transfer_out",
      "StockTransfer",
      transfer._id,
      `Transfer to branch ${transfer.toBranch_id}`
    );

    // Check if item exists in destination branch, create if not
    let destItem = await InventoryItem.findOne({
      branch_id: transfer.toBranch_id,
      name: item.name,
      category: item.category,
    });

    if (!destItem) {
      // Create item in destination branch
      destItem = new InventoryItem({
        branch_id: transfer.toBranch_id,
        category: item.category,
        name: item.name,
        description: item.description || "",
        minQuantity: item.minQuantity,
        unit: item.unit,
        currentStock: 0,
      });
      await destItem.save();
    }

    // Add to destination branch
    await updateStockAndCreateMovement(
      transfer.toBranch_id,
      destItem._id,
      transfer.quantity,
      "transfer_in",
      "StockTransfer",
      transfer._id,
      `Transfer from branch ${transfer.fromBranch_id}`
    );

    // Mark as completed
    transfer.status = "completed";
    transfer.completedDate = new Date();
    await transfer.save();

    const populated = await StockTransfer.findById(transfer._id)
      .populate("fromBranch_id", "branch_name")
      .populate("toBranch_id", "branch_name")
      .populate("item_id", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email");

    res.json(populated);
  } catch (err) {
    console.error("APPROVE TRANSFER ERROR:", err);
    res.status(500).json({ message: "Failed to approve transfer" });
  }
});

// PUT /api/inventory/transfers/:id/reject
router.put("/transfers/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const transfer = await StockTransfer.findById(id);

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    if (transfer.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Transfer is not in pending status" });
    }

    transfer.status = "rejected";
    if (approvedBy) {
      transfer.approvedBy = approvedBy;
    }
    await transfer.save();

    const populated = await StockTransfer.findById(transfer._id)
      .populate("fromBranch_id", "branch_name")
      .populate("toBranch_id", "branch_name")
      .populate("item_id", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email");

    res.json(populated);
  } catch (err) {
    console.error("REJECT TRANSFER ERROR:", err);
    res.status(500).json({ message: "Failed to reject transfer" });
  }
});

/* ================= ADJUSTMENTS ================= */

// GET /api/inventory/adjustments?branchId=...&itemId=...&startDate=...&endDate=...
router.get("/adjustments", async (req, res) => {
  try {
    const { branchId, itemId, startDate, endDate } = req.query;

    const filter = {};
    if (branchId) filter.branch_id = branchId;
    if (itemId) filter.item_id = itemId;
    if (startDate || endDate) {
      filter.adjustmentDate = {};
      if (startDate) filter.adjustmentDate.$gte = new Date(startDate);
      if (endDate) filter.adjustmentDate.$lte = new Date(endDate);
    }

    const adjustments = await StockAdjustment.find(filter)
      .populate("item_id", "name category unit")
      .populate("adjustedBy", "name email")
      .sort({ adjustmentDate: -1, createdAt: -1 })
      .limit(100);

    res.json(adjustments);
  } catch (err) {
    console.error("GET ADJUSTMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load adjustments" });
  }
});

// POST /api/inventory/adjustments
router.post("/adjustments", async (req, res) => {
  try {
    const {
      branch_id,
      item_id,
      quantity,
      reason,
      description,
      adjustedBy,
    } = req.body;

    if (!branch_id || !item_id || !quantity || !reason || !adjustedBy) {
      return res.status(400).json({
        message:
          "branch_id, item_id, quantity, reason, and adjustedBy are required",
      });
    }

    // Verify item belongs to branch
    const item = await InventoryItem.findOne({
      _id: item_id,
      branch_id: branch_id,
    });

    if (!item) {
      return res
        .status(400)
        .json({ message: "Item not found or does not belong to branch" });
    }

    // Create adjustment
    const adjustment = new StockAdjustment({
      branch_id,
      item_id,
      quantity, // Can be negative for reductions
      reason,
      description: description || "",
      adjustedBy,
      adjustmentDate: new Date(),
    });

    await adjustment.save();

    // Update stock and create movement
    const movementType =
      reason === "opening_stock" ? "opening_stock" : "adjustment";
    await updateStockAndCreateMovement(
      branch_id,
      item_id,
      quantity,
      movementType,
      "StockAdjustment",
      adjustment._id,
      `Adjustment: ${reason}${description ? ` - ${description}` : ""}`
    );

    const populated = await StockAdjustment.findById(adjustment._id)
      .populate("item_id", "name category unit")
      .populate("adjustedBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE ADJUSTMENT ERROR:", err);
    if (err.message === "Stock cannot be negative") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create adjustment" });
  }
});

/* ================= OPENING STOCK ================= */

// POST /api/inventory/opening-stock
router.post("/opening-stock", async (req, res) => {
  try {
    const { branch_id, items, adjustedBy } = req.body;

    if (!branch_id || !items || !Array.isArray(items) || !adjustedBy) {
      return res.status(400).json({
        message:
          "branch_id, items (array), and adjustedBy are required",
      });
    }

    const results = [];

    for (const itemData of items) {
      const { item_id, quantity } = itemData;

      if (!item_id || quantity === undefined) {
        continue;
      }

      // Verify item belongs to branch
      const item = await InventoryItem.findOne({
        _id: item_id,
        branch_id: branch_id,
      });

      if (!item) {
        continue;
      }

      // Calculate adjustment quantity (current stock might be 0, so we set it to quantity)
      const currentStock = item.currentStock || 0;
      const adjustmentQuantity = quantity - currentStock;

      if (adjustmentQuantity === 0) {
        continue; // No change needed
      }

      // Create adjustment
      const adjustment = new StockAdjustment({
        branch_id,
        item_id,
        quantity: adjustmentQuantity,
        reason: "opening_stock",
        description: "Opening stock entry",
        adjustedBy,
        adjustmentDate: new Date(),
      });

      await adjustment.save();

      // Update stock and create movement
      await updateStockAndCreateMovement(
        branch_id,
        item_id,
        adjustmentQuantity,
        "opening_stock",
        "StockAdjustment",
        adjustment._id,
        "Opening stock entry"
      );

      const updatedItem = await InventoryItem.findById(item_id);
      results.push({
        item_id,
        quantity: updatedItem.currentStock,
      });
    }

    res.status(201).json({ items: results });
  } catch (err) {
    console.error("SET OPENING STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to set opening stock" });
  }
});

/* ================= REPORTS ================= */

// GET /api/inventory/reports/current-stock?branchId=...&category=...
router.get("/reports/current-stock", async (req, res) => {
  try {
    const { branchId, category } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const filter = { branch_id: branchId };
    if (category) {
      filter.category = category;
    }

    const items = await InventoryItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    // Group by category
    const byCategory = {};
    items.forEach((item) => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push({
        id: item._id,
        name: item.name,
        currentStock: item.currentStock,
        minQuantity: item.minQuantity,
        unit: item.unit,
        isLowStock: item.currentStock < item.minQuantity,
      });
    });

    res.json({
      branchId,
      totalItems: items.length,
      byCategory,
      items: items.map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minQuantity: item.minQuantity,
        unit: item.unit,
        isLowStock: item.currentStock < item.minQuantity,
      })),
    });
  } catch (err) {
    console.error("CURRENT STOCK REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// GET /api/inventory/reports/movement?branchId=...&itemId=...&startDate=...&endDate=...&category=...
router.get("/reports/movement", async (req, res) => {
  try {
    const { branchId, itemId, startDate, endDate, category } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const filter = { branch_id: branchId };
    if (itemId) filter.item_id = itemId;
    if (startDate || endDate) {
      filter.movementDate = {};
      if (startDate) filter.movementDate.$gte = new Date(startDate);
      if (endDate) filter.movementDate.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(filter)
      .populate("item_id", "name category unit")
      .sort({ movementDate: -1, createdAt: -1 })
      .limit(500);

    // Filter by category if specified
    let filteredMovements = movements;
    if (category) {
      filteredMovements = movements.filter(
        (m) => m.item_id && m.item_id.category === category
      );
    }

    // Group by item
    const byItem = {};
    filteredMovements.forEach((movement) => {
      if (!movement.item_id) return;
      const itemId = String(movement.item_id._id);
      if (!byItem[itemId]) {
        byItem[itemId] = {
          item: {
            id: movement.item_id._id,
            name: movement.item_id.name,
            category: movement.item_id.category,
            unit: movement.item_id.unit,
          },
          movements: [],
          totalIn: 0,
          totalOut: 0,
        };
      }
      byItem[itemId].movements.push({
        id: movement._id,
        type: movement.movementType,
        quantity: movement.quantity,
        date: movement.movementDate,
        notes: movement.notes,
      });
      if (movement.quantity > 0) {
        byItem[itemId].totalIn += movement.quantity;
      } else {
        byItem[itemId].totalOut += Math.abs(movement.quantity);
      }
    });

    res.json({
      branchId,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      byItem: Object.values(byItem),
      movements: filteredMovements.map((m) => ({
        id: m._id,
        item: m.item_id
          ? {
              id: m.item_id._id,
              name: m.item_id.name,
              category: m.item_id.category,
            }
          : null,
        type: m.movementType,
        quantity: m.quantity,
        date: m.movementDate,
        notes: m.notes,
      })),
    });
  } catch (err) {
    console.error("MOVEMENT REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// GET /api/inventory/reports/valuation?branchId=...
router.get("/reports/valuation", async (req, res) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const items = await InventoryItem.find({ branch_id: branchId })
      .sort({ category: 1, name: 1 })
      .lean();

    // Group by category
    const byCategory = {};
    items.forEach((item) => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = {
          category: item.category,
          itemCount: 0,
          totalQuantity: 0,
          items: [],
        };
      }
      byCategory[item.category].itemCount += 1;
      byCategory[item.category].totalQuantity += item.currentStock;
      byCategory[item.category].items.push({
        id: item._id,
        name: item.name,
        quantity: item.currentStock,
        unit: item.unit,
      });
    });

    res.json({
      branchId,
      summary: {
        totalItems: items.length,
        totalCategories: Object.keys(byCategory).length,
        byCategory: Object.values(byCategory),
      },
      items: items.map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        quantity: item.currentStock,
        unit: item.unit,
      })),
    });
  } catch (err) {
    console.error("VALUATION REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

export default router;