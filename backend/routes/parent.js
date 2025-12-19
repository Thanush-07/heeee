import express from "express";
import { Student } from "../models/Student.js";
import { FeePayment } from "../models/FeePayment.js";
import { FeeStructure } from "../models/FeeStructure.js";
import { User } from "../models/User.js";

const router = express.Router();

// GET /api/parent/:parentId/student
// Get student details for parent (assumes parent has one student assigned)
router.get("/:parentId/student", async (req, res) => {
  try {
    const { parentId } = req.params;
    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    // Find student by parent's name in parentName field
    // Parent's stored student reference would be better, but using name-based lookup
    const student = await Student.findOne({ parentName: parent.name });
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("PARENT GET STUDENT ERROR", err);
    res.status(500).json({ message: "Failed to load student" });
  }
});

// GET /api/parent/:parentId/fees
// Get fee structure and payment history for student
router.get("/:parentId/fees", async (req, res) => {
  try {
    const { parentId } = req.params;
    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    // Find student
    const student = await Student.findOne({ parentName: parent.name });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Get fee structure for student's class
    const feeStructure = await FeeStructure.findOne({
      branch_id: student.branch_id,
      class: String(student.class),
    });

    // Get payment history
    const payments = await FeePayment.find({
      studentId: student._id,
    }).sort({ date: -1 });

    // Calculate totals
    const structureTotal = feeStructure
      ? Object.values(feeStructure.categories || {}).reduce(
          (sum, val) => sum + Number(val || 0),
          0
        )
      : 0;

    const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingAmount = Math.max(0, structureTotal - paidTotal);

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        class: student.class,
        section: student.section,
        rollNo: student.rollNo,
      },
      feeStructure: feeStructure ? feeStructure.categories : {},
      feeStructureTotal: structureTotal,
      paidTotal,
      pendingAmount,
      payments,
    });
  } catch (err) {
    console.error("PARENT FEES ERROR", err);
    res.status(500).json({ message: "Failed to load fees" });
  }
});

// GET /api/parent/:parentId/marks
// Get student marks/grades (placeholder - extend with actual marks model)
router.get("/:parentId/marks", async (req, res) => {
  try {
    const { parentId } = req.params;
    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    // Find student
    const student = await Student.findOne({ parentName: parent.name });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Placeholder marks data - extend with actual marks collection
    const marks = {
      student: {
        _id: student._id,
        name: student.name,
        class: student.class,
        section: student.section,
      },
      exams: [
        {
          name: "Term 1 Exam",
          date: "2024-09-15",
          subjects: [
            { name: "Mathematics", marks: 85, totalMarks: 100 },
            { name: "English", marks: 78, totalMarks: 100 },
            { name: "Science", marks: 92, totalMarks: 100 },
            { name: "Social Studies", marks: 88, totalMarks: 100 },
            { name: "Hindi", marks: 82, totalMarks: 100 },
          ],
        },
        {
          name: "Term 2 Exam",
          date: "2024-12-15",
          subjects: [
            { name: "Mathematics", marks: 88, totalMarks: 100 },
            { name: "English", marks: 80, totalMarks: 100 },
            { name: "Science", marks: 95, totalMarks: 100 },
            { name: "Social Studies", marks: 91, totalMarks: 100 },
            { name: "Hindi", marks: 85, totalMarks: 100 },
          ],
        },
      ],
      attendance: {
        presentDays: 145,
        totalDays: 160,
        percentage: 90.6,
      },
    };

    res.json(marks);
  } catch (err) {
    console.error("PARENT MARKS ERROR", err);
    res.status(500).json({ message: "Failed to load marks" });
  }
});

// GET /api/parent/verify?studentName=&phone=
// Verify parent login by student name and phone (parent login)
router.get("/verify", async (req, res) => {
  try {
    const { studentName, phone } = req.query;

    if (!studentName || !phone) {
      return res
        .status(400)
        .json({ message: "Student name and phone are required" });
    }

    // Find student
    const student = await Student.findOne({
      name: { $regex: studentName, $options: "i" },
      phoneNo: phone,
    });

    if (!student) {
      return res
        .status(400)
        .json({ message: "Student not found with provided credentials" });
    }

    // Find or create parent user
    let parent = await User.findOne({
      name: student.parentName,
      role: "parent",
    });

    if (!parent) {
      // Create parent user if doesn't exist
      parent = new User({
        name: student.parentName,
        email: `parent_${student._id}@localhost`,
        phone: student.phoneNo,
        role: "parent",
        institution_id: student.institution_id,
        branch_id: student.branch_id,
        status: "active",
      });

      // Set password as phone number
      await parent.setPassword(phone);
      await parent.save();
    }

    res.json({
      parentId: parent._id,
      studentId: student._id,
      parentName: parent.name,
      studentName: student.name,
    });
  } catch (err) {
    console.error("PARENT VERIFY ERROR", err);
    res.status(500).json({ message: "Failed to verify parent" });
  }
});

export default router;
