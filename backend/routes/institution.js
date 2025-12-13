// backend/routes/institution.js
import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Branch } from "../models/Branch.js";
import { Institution } from "../models/Institution.js";
import { Student } from "../models/Student.js";
import { FeePayment } from "../models/FeePayment.js";


const router = express.Router();

// Multer memory storage for logos
const upload = multer({ storage: multer.memoryStorage() });

/* ================= BRANCH ADMINS ================= */

// GET /api/institution/:institutionId/branch-admins
router.get("/:institutionId/branch-admins", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const admins = await User.find({
      role: "branch_admin",
      institution_id: institutionId,
    })
      .populate("branch_id", "branch_name")
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (err) {
    console.error("GET BRANCH ADMINS ERROR:", err);
    res.status(500).json({ message: "Failed to load branch admins" });
  }
});

// POST /api/institution/:institutionId/branch-admins
router.post("/:institutionId/branch-admins", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { name, email, phone, branch_id } = req.body;

    const branch = await Branch.findOne({
      _id: branch_id,
      institution_id: institutionId,
    });
    if (!branch) {
      return res
        .status(400)
        .json({ message: "Branch does not belong to this institution" });
    }

    const user = new User({
      name,
      email,
      phone,
      role: "branch_admin",
      institution_id: institutionId,
      branch_id,
      status: "active",
      password_hash: "",
    });

    await user.setPassword("Branch@123");
    await user.save();
    const populated = await user.populate("branch_id", "branch_name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE BRANCH ADMIN ERROR:", err);
    res.status(500).json({ message: "Failed to create branch admin" });
  }
});

/* ================= BRANCHES CRUD ================= */

// GET /api/institution/:institutionId/branches
router.get("/:institutionId/branches", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const branches = await Branch.find({ institution_id: institutionId });
    res.json(branches);
  } catch (err) {
    console.error("GET BRANCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load branches" });
  }
});

// POST /api/institution/:institutionId/branches
router.post("/:institutionId/branches", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const {
      branch_name,
      address,
      location,
      managerName,
      managerEmail,
      contactPhone,
      classes,
      feesText,
    } = req.body;

    if (!branch_name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const branch = new Branch({
      institution_id: institutionId,
      branch_name,
      address,
      location,
      managerName,
      managerEmail,
      contactPhone,
      classes: classes || [],
      feesText: feesText || "",
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    console.error("CREATE BRANCH ERROR:", err);
    res.status(500).json({ message: "Failed to save branch" });
  }
});

// PUT /api/institution/:institutionId/branches/:branchId
router.put("/:institutionId/branches/:branchId", async (req, res) => {
  try {
    const { institutionId, branchId } = req.params;
    const update = {
      branch_name: req.body.branch_name,
      address: req.body.address,
      location: req.body.location,
      managerName: req.body.managerName,
      managerEmail: req.body.managerEmail,
      contactPhone: req.body.contactPhone,
      classes: req.body.classes || [],
      feesText: req.body.feesText || "",
    };

    const branch = await Branch.findOneAndUpdate(
      { _id: branchId, institution_id: institutionId },
      update,
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (err) {
    console.error("UPDATE BRANCH ERROR:", err);
    res.status(500).json({ message: "Failed to save branch" });
  }
});

// DELETE /api/institution/:institutionId/branches/:branchId
router.delete("/:institutionId/branches/:branchId", async (req, res) => {
  try {
    const { institutionId, branchId } = req.params;

    const branch = await Branch.findOneAndDelete({
      _id: branchId,
      institution_id: institutionId,
    });

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted" });
  } catch (err) {
    console.error("DELETE BRANCH ERROR:", err);
    res.status(500).json({ message: "Failed to delete branch" });
  }
});

/* ================= BRANCH LOGO (Buffer in DB) ================= */

// POST /api/institution/branches/:branchId/logo
router.post(
  "/branches/:branchId/logo",
  upload.single("logo"),
  async (req, res) => {
    try {
      const { branchId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No logo file uploaded" });
      }

      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      branch.logo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };

      await branch.save();

      res.json({ message: "Logo uploaded", branchId: branch._id });
    } catch (err) {
      console.error("BRANCH LOGO UPLOAD ERROR:", err);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  }
);

// GET /api/institution/branches/:branchId/logo
router.get("/branches/:branchId/logo", async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById(branchId).select("logo");

    if (!branch || !branch.logo || !branch.logo.data) {
      return res.status(404).end();
    }

    res.set("Content-Type", branch.logo.contentType || "image/png");
    res.send(branch.logo.data);
  } catch (err) {
    console.error("GET BRANCH LOGO ERROR:", err);
    res.status(500).end();
  }
});

/* ================= INSTITUTION DASHBOARD ================= */

// GET /api/institution/:institutionId/dashboard
router.get("/:institutionId/dashboard", async (req, res) => {
  try {
    const { institutionId } = req.params;

    const inst = await Institution.findById(institutionId).select(
      "name address"
    );

    if (!inst) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const branches = await Branch.find({ institution_id: institutionId }).select(
      "branch_name location contactPhone"
    );

    const [studentAgg, feeAgg] = await Promise.all([
      Student.aggregate([
        {
          $match: {
            institution_id: new mongoose.Types.ObjectId(institutionId),
          },
        },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
          },
        },
      ]),
      FeePayment.aggregate([
        {
          $match: {
            institution_id: new mongoose.Types.ObjectId(institutionId),
          },
        },
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totals = {
      branches: branches.length,
      students: studentAgg[0]?.totalStudents || 0,
      feeCollected: feeAgg[0]?.totalFee || 0,
    };

    const recentActivities = []; // fill later if needed

    res.json({
      institution: {
        id: inst._id,
        name: inst.name,
        address: inst.address,
      },
      totals,
      branches,
      recentActivities,
    });
  } catch (err) {
    console.error("INSTITUTION DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/institution/:institutionId/logo  (institution logo)
router.get("/:institutionId/logo", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const inst = await Institution.findById(institutionId).select("logo");

    if (!inst || !inst.logo || !inst.logo.data) {
      return res.status(404).end();
    }

    res.set("Content-Type", inst.logo.contentType || "image/png");
    res.send(inst.logo.data);
  } catch (err) {
    console.error("INSTITUTION LOGO ERROR:", err);
    res.status(500).end();
  }
});
// GET /api/institution/:institutionId/report?branchId=...
router.get("/:institutionId/report", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { branchId } = req.query;

    const instObjectId = new mongoose.Types.ObjectId(institutionId);

    // Optional filter by single branch
    const branchMatch = { institution_id: instObjectId };
    if (branchId) {
      branchMatch._id = new mongoose.Types.ObjectId(branchId);
    }

    // Load all branches for this institution (or single branch if branchId given)
    const branches = await Branch.find(branchMatch).select("branch_name");

    const branchIds = branches.map((b) => b._id);
    if (branchIds.length === 0) {
      return res.json({ branches: [] });
    }

    // Aggregate students and fees per branch
    const [studentAgg, feeAgg] = await Promise.all([
      Student.aggregate([
        {
          $match: {
            institution_id: instObjectId,
            branch_id: { $in: branchIds },
          },
        },
        {
          $group: {
            _id: "$branch_id",
            students: { $sum: 1 },
          },
        },
      ]),
      FeePayment.aggregate([
        {
          $match: {
            institution_id: instObjectId,
            branch_id: { $in: branchIds },
          },
        },
        {
          $group: {
            _id: "$branch_id",
            feeCollected: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const nameById = new Map(
      branches.map((b) => [String(b._id), b.branch_name])
    );

    const map = new Map();

    studentAgg.forEach((s) => {
      map.set(String(s._id), {
        branchId: s._id,
        students: s.students,
        feeCollected: 0,
      });
    });

    feeAgg.forEach((f) => {
      const key = String(f._id);
      const row =
        map.get(key) || {
          branchId: f._id,
          students: 0,
          feeCollected: 0,
        };
      row.feeCollected = f.feeCollected;
      map.set(key, row);
    });

    const stats = Array.from(map.values()).map((r) => ({
      branchId: r.branchId,
      branchName: nameById.get(String(r.branchId)) || "",
      students: r.students,
      feeCollected: r.feeCollected,
    }));

    res.json({ branches: stats });
  } catch (err) {
    console.error("INSTITUTION REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to load report" });
  }
});

export default router;
