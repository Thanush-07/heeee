// routes/branch.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";

import { Branch } from "../models/Branch.js";
import { Student } from "../models/Student.js";
import { FeePayment } from "../models/FeePayment.js";
import { User } from "../models/User.js";
import { FeeStructure } from "../models/FeeStructure.js";
import { Expense } from "../models/Expense.js";

const router = express.Router();

/* ================= BRANCH DASHBOARD ================= */

// GET /api/branch/:branchId/dashboard
router.get("/:branchId/dashboard", async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId).select(
      "branch_name address location managerName contactPhone classes feesText"
    );

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const [studentAgg, feeAgg, staffAgg] = await Promise.all([
      Student.aggregate([
        {
          $match: {
            branch_id: new mongoose.Types.ObjectId(branchId),
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
            branch_id: new mongoose.Types.ObjectId(branchId),
          },
        },
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$amount" },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            branch_id: new mongoose.Types.ObjectId(branchId),
            role: "staff",
          },
        },
        {
          $group: {
            _id: null,
            totalStaff: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totals = {
      students: studentAgg[0]?.totalStudents || 0,
      feeCollected: feeAgg[0]?.totalFee || 0,
      staff: staffAgg[0]?.totalStaff || 0,
    };

    // Get recent students or fees
    const recentStudents = await Student.find({ branch_id: branchId })
      .select("name className createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentFees = await FeePayment.find({ branch_id: branchId })
      .select("studentName amount createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivities = [
      ...recentStudents.map(s => ({
        id: s._id,
        description: `New student: ${s.name} (${s.className})`,
        when: new Date(s.createdAt).toLocaleDateString(),
        by: "System",
      })),
      ...recentFees.map(f => ({
        id: f._id,
        description: `Fee payment: ₹${f.amount} for ${f.studentName}`,
        when: new Date(f.createdAt).toLocaleDateString(),
        by: "System",
      })),
    ].sort((a, b) => new Date(b.when) - new Date(a.when)).slice(0, 10);

    res.json({
      branch: {
        id: branch._id,
        name: branch.branch_name,
        address: branch.address,
        location: branch.location,
        managerName: branch.managerName,
        contactPhone: branch.contactPhone,
        classes: branch.classes,
        feesText: branch.feesText,
      },
      totals,
      recentActivities,
    });
  } catch (err) {
    console.error("BRANCH DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/* ================= BRANCH REPORTS ================= */

// GET /api/branch/:branchId/reports/students
router.get("/:branchId/reports/students", async (req, res) => {
  try {
    const { branchId } = req.params;
    const students = await Student.find({ branch_id: branchId })
      .select("name className createdAt")
      .sort({ createdAt: -1 });

    res.json({ students });
  } catch (err) {
    console.error("STUDENTS REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate students report" });
  }
});

// GET /api/branch/:branchId/reports/fees
router.get("/:branchId/reports/fees", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { branch_id: new mongoose.Types.ObjectId(branchId) };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const fees = await FeePayment.find(filter)
      .select("studentName amount createdAt")
      .sort({ createdAt: -1 });

    const totalCollected = fees.reduce((sum, fee) => sum + fee.amount, 0);

    res.json({ fees, totalCollected });
  } catch (err) {
    console.error("FEES REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate fees report" });
  }
});

// GET /api/branch/:branchId/reports/pending
router.get("/:branchId/reports/pending", async (req, res) => {
  try {
    const { branchId } = req.params;

    // This is a simplified version - in reality you'd need fee structure data
    const students = await Student.find({ branch_id: branchId })
      .select("name className");

    // Mock pending fees - replace with actual calculation
    const pendingFees = students.map(student => ({
      ...student.toObject(),
      pendingAmount: Math.floor(Math.random() * 5000) + 1000, // Mock data
    }));

    res.json({ pendingFees });
  } catch (err) {
    console.error("PENDING FEES REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate pending fees report" });
  }
});

// GET /api/branch/:branchId/reports/daily
router.get("/:branchId/reports/daily", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    let matchStage = {
      branch_id: new mongoose.Types.ObjectId(branchId),
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const dailySummary = await FeePayment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          total: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json({ dailySummary });
  } catch (err) {
    console.error("DAILY FEES REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate daily fees report" });
  }
});

// GET /api/branch/:branchId/reports/billing
router.get("/:branchId/reports/billing", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { branch_id: new mongoose.Types.ObjectId(branchId) };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const billings = await FeePayment.find(filter)
      .select("studentName amount createdAt")
      .sort({ createdAt: -1 });

    // Add mock invoice numbers
    const billingsWithInvoices = billings.map((bill, index) => ({
      ...bill.toObject(),
      invoiceNumber: `INV-${branchId.slice(-4).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
    }));

    res.json({ billings: billingsWithInvoices });
  } catch (err) {
    console.error("BILLING REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate billing report" });
  }
});

// GET /api/branch/:branchId/reports/stock
router.get("/:branchId/reports/stock", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { category } = req.query;

    let filter = { branch_id: new mongoose.Types.ObjectId(branchId) };
    if (category) {
      filter.category = category;
    }

    const stock = await InventoryItem.find(filter)
      .select("name category currentStock minQuantity unit")
      .sort({ category: 1, name: 1 });

    res.json({ stock });
  } catch (err) {
    console.error("STOCK REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate stock report" });
  }
});

// GET /api/branch/:branchId/reports/attendance
router.get("/:branchId/reports/attendance", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // Mock attendance data - replace with actual attendance model
    const attendance = [
      {
        _id: "1",
        staffName: "Staff Member 1",
        date: new Date(),
        status: "Present",
      },
      {
        _id: "2",
        staffName: "Staff Member 2",
        date: new Date(),
        status: "Present",
      },
    ];

    res.json({ attendance });
  } catch (err) {
    console.error("ATTENDANCE REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate attendance report" });
  }
});

// GET /api/branch/:branchId/reports/expenses
router.get("/:branchId/reports/expenses", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // Mock expenses data - replace with actual expense model
    const expenses = [
      {
        _id: "1",
        description: "Office Supplies",
        amount: 2500,
        date: new Date(),
        category: "Office",
      },
      {
        _id: "2",
        description: "Transportation",
        amount: 1500,
        date: new Date(),
        category: "Transport",
      },
    ];

    res.json({ expenses });
  } catch (err) {
    console.error("EXPENSES REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate expenses report" });
  }
});

// GET /api/branch/:branchId/reports/transport
router.get("/:branchId/reports/transport", async (req, res) => {
  try {
    const { branchId } = req.params;

    // Mock transport data - replace with actual bus/transport model
    const transport = [
      {
        _id: "1",
        busNumber: "TN01AB1234",
        route: "Chrompet to School",
        studentCount: 25,
        driverName: "Driver Kumar",
      },
      {
        _id: "2",
        busNumber: "TN01CD5678",
        route: "Tambaram to School",
        studentCount: 20,
        driverName: "Driver Raj",
      },
    ];

    res.json({ transport });
  } catch (err) {
    console.error("TRANSPORT REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to generate transport report" });
  }
});

/* ================= BRANCH LOGO ================= */

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/branch/:branchId/logo
router.post("/:branchId/logo", upload.single("logo"), async (req, res) => {
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
});

// GET /api/branch/:branchId/logo
router.get("/:branchId/logo", async (req, res) => {
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

/* ================= BRANCH EXPENSES ================= */

// GET /api/branch/:branchId/expenses
router.get("/:branchId/expenses", async (req, res) => {
  try {
    const { branchId } = req.params;
    const list = await Expense.find({ branch_id: branchId })
      .sort({ date: -1, createdAt: -1 })
      .limit(200);
    res.json(list);
  } catch (err) {
    console.error("GET EXPENSES ERROR:", err);
    res.status(500).json({ message: "Failed to load expenses" });
  }
});

// POST /api/branch/:branchId/expenses
router.post("/:branchId/expenses", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { category, description, amount, date } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ message: "Category and amount are required" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const expense = new Expense({
      institution_id: branch.institution_id,
      branch_id: branchId,
      category: String(category).trim(),
      description: description || "",
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error("CREATE EXPENSE ERROR:", err);
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create expense" });
  }
});

/* ================= STAFF MANAGEMENT ================= */

// GET /api/branch/:branchId/staff
router.get("/:branchId/staff", async (req, res) => {
  try {
    const { branchId } = req.params;
    const staff = await User.find({
      branch_id: branchId,
      role: "staff"
    }).select("-password_hash").sort({ createdAt: -1 });

    res.json(staff);
  } catch (err) {
    console.error("GET STAFF ERROR:", err);
    res.status(500).json({ message: "Failed to load staff" });
  }
});

// POST /api/branch/:branchId/staff
router.post("/:branchId/staff", upload.single("photo"), async (req, res) => {
  try {
    const { branchId } = req.params;
    const {
      name,
      email,
      phone,
      age,
      address,
      location,
      staffCategory,
      staffSubcategory
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !age || !address || !location || !staffCategory) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Get branch and institution info
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const staff = new User({
      name,
      email,
      phone,
      age: Number(age),
      address,
      location,
      staffCategory,
      staffSubcategory: staffSubcategory && typeof staffSubcategory === 'string' ? staffSubcategory.trim() : undefined,
      role: "staff",
      institution_id: branch.institution_id,
      branch_id: branchId,
      status: "active",
      password_hash: "",
    });

    // handle classes if provided (stringified JSON or comma-separated)
    if (req.body.classes) {
      let classes = req.body.classes;
      if (typeof classes === 'string') {
        try { classes = JSON.parse(classes); }
        catch(e) { classes = classes.split(',').map(s=>s.trim()).filter(Boolean); }
      }
      if (Array.isArray(classes)) staff.classes = classes;
    }

    // Set default password
    await staff.setPassword("Staff@123");

    // Handle photo upload
    if (req.file) {
      staff.photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await staff.save();

    // Return staff without password
    const staffResponse = await User.findById(staff._id).select("-password_hash");
    res.status(201).json(staffResponse);
  } catch (err) {
    console.error("CREATE STAFF ERROR:", err);
    res.status(500).json({ message: "Failed to create staff member" });
  }
});

// PUT /api/branch/:branchId/staff/:staffId
router.put("/:branchId/staff/:staffId", upload.single("photo"), async (req, res) => {
  try {
    const { branchId, staffId } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.password_hash;
    delete updateData.role;
    delete updateData.institution_id;
    delete updateData.branch_id;

    // Convert age to number if provided
    if (updateData.age) {
      updateData.age = Number(updateData.age);
    }

    // normalize staffSubcategory (trim string)
    if (typeof updateData.staffSubcategory === 'string') {
      updateData.staffSubcategory = updateData.staffSubcategory.trim();
    }

    // handle classes update (might be JSON string or comma separated)
    if (updateData.classes) {
      let classes = updateData.classes;
      if (typeof classes === 'string') {
        try { classes = JSON.parse(classes); }
        catch(e) { classes = classes.split(',').map(s=>s.trim()).filter(Boolean); }
      }
      if (Array.isArray(classes)) updateData.classes = classes;
      else delete updateData.classes;
    }

    // Handle photo upload
    if (req.file) {
      updateData.photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const staff = await User.findOneAndUpdate(
      { _id: staffId, branch_id: branchId, role: "staff" },
      updateData,
      { new: true }
    ).select("-password_hash");

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json(staff);
  } catch (err) {
    console.error("UPDATE STAFF ERROR:", err);
    res.status(500).json({ message: "Failed to update staff member" });
  }
});

// DELETE /api/branch/:branchId/staff/:staffId
router.delete("/:branchId/staff/:staffId", async (req, res) => {
  try {
    const { branchId, staffId } = req.params;

    const staff = await User.findOneAndDelete({
      _id: staffId,
      branch_id: branchId,
      role: "staff"
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ message: "Staff member deleted successfully" });
  } catch (err) {
    console.error("DELETE STAFF ERROR:", err);
    res.status(500).json({ message: "Failed to delete staff member" });
  }
});

// GET /api/branch/:branchId/staff/:staffId/photo
router.get("/:branchId/staff/:staffId/photo", async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await User.findById(staffId).select("photo");

    if (!staff || !staff.photo || !staff.photo.data) {
      return res.status(404).end();
    }

    res.set("Content-Type", staff.photo.contentType || "image/png");
    res.send(staff.photo.data);
  } catch (err) {
    console.error("GET STAFF PHOTO ERROR:", err);
    res.status(500).end();
  }
});

/* ================= STUDENT MANAGEMENT ================= */

// GET /api/branch/:branchId/students
router.get("/:branchId/students", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { status, class: classFilter, academicYear } = req.query;

    let filter = { branch_id: branchId };
    if (status) filter.status = status;
    if (classFilter) filter.class = classFilter;
    if (academicYear) filter.academicYear = academicYear;

    const students = await Student.find(filter)
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load students" });
  }
});

// POST /api/branch/:branchId/students
router.post("/:branchId/students", async (req, res) => {
  try {
    const { branchId } = req.params;
    const {
      name,
      class: studentClass,
      section,
      rollNo,
      parentName,
      phoneNo,
      address,
      admissionNumber,
      academicYear,
      dateOfBirth,
      fees,
      residency,
      busFees,
      hostelFees,
      emisNo,
      image,
      aadharCardNumber,
      rationCardNumber,
      motherName,
      fatherName
    } = req.body;

    // Validate required fields
    if (!name || !studentClass || !section || !rollNo || !parentName || !phoneNo || !address || !admissionNumber || !academicYear) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNumber });
    if (existingStudent) {
      return res.status(400).json({ message: "Admission number already exists" });
    }

    // Check if roll number already exists in the same class and section
    const existingRollNo = await Student.findOne({
      branch_id: branchId,
      class: studentClass,
      section,
      rollNo
    });
    if (existingRollNo) {
      return res.status(400).json({ message: "Roll number already exists in this class and section" });
    }

    // Get branch and institution info
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const studentData = {
      institution_id: branch.institution_id,
      branch_id: branchId,
      name,
      class: studentClass,
      section,
      rollNo,
      parentName,
      phoneNo,
      address,
      admissionNumber,
      academicYear,
      dateOfBirth: dateOfBirth || null,
      status: "active"
    };

    // Add optional fields if provided
    if (fees !== undefined && fees !== null) studentData.fees = fees;
    if (residency) studentData.residency = residency;
    if (busFees !== undefined && busFees !== null) studentData.busFees = busFees;
    if (hostelFees !== undefined && hostelFees !== null) studentData.hostelFees = hostelFees;
    if (emisNo) studentData.emisNo = emisNo;
    if (image) studentData.image = image;
    if (aadharCardNumber) studentData.aadharCardNumber = aadharCardNumber;
    if (rationCardNumber) studentData.rationCardNumber = rationCardNumber;
    if (motherName) studentData.motherName = motherName;
    if (fatherName) studentData.fatherName = fatherName;

    const student = new Student(studentData);

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error("CREATE STUDENT ERROR:", err);
    res.status(500).json({ message: "Failed to create student" });
  }
});

// PUT /api/branch/:branchId/students/:studentId
router.put("/:branchId/students/:studentId", async (req, res) => {
  try {
    const { branchId, studentId } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.institution_id;
    delete updateData.branch_id;
    delete updateData.admissionNumber; // Admission number should not be changed

    // Drop undefined fields so we only set what is provided
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const existingStudent = await Student.findOne({ _id: studentId, branch_id: branchId });
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // If updating roll number, check for conflicts in the target class/section
    if (updateData.rollNo) {
      const targetClass = updateData.class || existingStudent.class;
      const targetSection = updateData.section || existingStudent.section;

      const existingRollNo = await Student.findOne({
        branch_id: branchId,
        class: targetClass,
        section: targetSection,
        rollNo: updateData.rollNo,
        _id: { $ne: studentId }
      });
      if (existingRollNo) {
        return res.status(400).json({ message: "Roll number already exists in this class and section" });
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, branch_id: branchId },
      { $set: updateData },
      { new: true }
    );

    res.json(student);
  } catch (err) {
    console.error("UPDATE STUDENT ERROR:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
});

// DELETE /api/branch/:branchId/students/:studentId
router.delete("/:branchId/students/:studentId", async (req, res) => {
  try {
    const { branchId, studentId } = req.params;

    const student = await Student.findOneAndDelete({
      _id: studentId,
      branch_id: branchId
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("DELETE STUDENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

// GET /api/branch/:branchId/students/:studentId
router.get("/:branchId/students/:studentId", async (req, res) => {
  try {
    const { branchId, studentId } = req.params;

    const student = await Student.findOne({
      _id: studentId,
      branch_id: branchId
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error("GET STUDENT ERROR:", err);
    res.status(500).json({ message: "Failed to load student" });
  }
});

// GET /api/branch/:branchId/students/stats/summary
router.get("/:branchId/students/stats/summary", async (req, res) => {
  try {
    const { branchId } = req.params;

    const stats = await Student.aggregate([
      { $match: { branch_id: new mongoose.Types.ObjectId(branchId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          left: { $sum: { $cond: [{ $eq: ["$status", "left"] }, 1, 0] } },
          transferred: { $sum: { $cond: [{ $eq: ["$status", "transferred"] }, 1, 0] } }
        }
      }
    ]);

    const classStats = await Student.aggregate([
      { $match: { branch_id: new mongoose.Types.ObjectId(branchId) } },
      {
        $group: {
          _id: "$class",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: stats[0] || { total: 0, active: 0, left: 0, transferred: 0 },
      classBreakdown: classStats
    });
  } catch (err) {
    console.error("STUDENT STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load student statistics" });
  }
});

// POST /api/branch/:branchId/students/generate-admission-number
router.post("/:branchId/students/generate-admission-number", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { academicYear } = req.body;

    if (!academicYear) {
      return res.status(400).json({ message: "Academic year is required" });
    }

    // Get the last admission number for this branch and academic year
    const lastStudent = await Student.findOne({
      branch_id: branchId,
      academicYear,
      admissionNumber: { $regex: `^${academicYear.replace('/', '')}` }
    })
    .sort({ admissionNumber: -1 });

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.admissionNumber.split('-').pop());
      nextNumber = lastNumber + 1;
    }

    const admissionNumber = `${academicYear.replace('/', '')}-${String(nextNumber).padStart(4, '0')}`;

    res.json({ admissionNumber });
  } catch (err) {
    console.error("GENERATE ADMISSION NUMBER ERROR:", err);
    res.status(500).json({ message: "Failed to generate admission number" });
  }
});

// GET /api/branch/:branchId/fee-structures
router.get("/:branchId/fee-structures", async (req, res) => {
  try {
    const { branchId } = req.params;
    const structures = await FeeStructure.find({ branch_id: branchId }).sort({ class: 1 });
    res.json(structures);
  } catch (err) {
    console.error("GET FEE STRUCTURES ERROR:", err);
    res.status(500).json({ message: "Failed to load fee structures" });
  }
});

// POST /api/branch/:branchId/fee-structures
router.post("/:branchId/fee-structures", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { class: cls, categories } = req.body;
    if (!cls || !categories) return res.status(400).json({ message: "Class and categories are required" });
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    const fs = new FeeStructure({ institution_id: branch.institution_id, branch_id: branchId, class: cls, categories });
    await fs.save();
    res.status(201).json(fs);
  } catch (err) {
    console.error("CREATE FEE STRUCTURE ERROR:", err);
    res.status(500).json({ message: "Failed to create fee structure" });
  }
});

// GET /api/branch/:branchId/fees
router.get("/:branchId/fees", async (req, res) => {
  try {
    const { branchId } = req.params;
    const fees = await FeePayment.find({ branch_id: branchId }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    console.error("GET FEES ERROR:", err);
    res.status(500).json({ message: "Failed to load fees" });
  }
});

// POST /api/branch/:branchId/fees
router.post("/:branchId/fees", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { amount, studentId, studentName, category, date, mode, class: cls } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    const payment = new FeePayment({
      institution_id: branch.institution_id,
      branch_id: branchId,
      amount: Number(amount),
      studentId,
      studentName,
      category,
      date: date ? new Date(date) : new Date(),
      mode,
      class: cls
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    console.error("CREATE FEE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to create fee payment" });
  }
});

export default router;