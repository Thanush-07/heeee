// backend/seedSample.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User.js";
import { Institution } from "./models/Institution.js";
import { Branch } from "./models/Branch.js";
import { Student } from "./models/Student.js";
import { FeePayment } from "./models/FeePayment.js";

dotenv.config();

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/first-crop_db";

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log("Mongo connected for seeding");

  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Branch.deleteMany({}),
    Student.deleteMany({}),
    FeePayment.deleteMany({}),
  ]);

  const companyAdmin = new User({
    name: "Company Admin",
    email: "company@erp.com",
    role: "company_admin",
    status: "active",
  });
  await companyAdmin.setPassword("Admin@123");
  await companyAdmin.save();

  const institution = new Institution({
    name: "Ematix Public School",
    institution_id: "INST001",
    location: "Main Road, Chennai",
  });
  await institution.save();

  const instAdmin = new User({
    name: "Institution Admin",
    email: "inst@ematix.com",
    role: "institution_admin",
    status: "active",
    institution_id: institution._id,
  });
  await instAdmin.setPassword("Admin@123");
  await instAdmin.save();

  const branch1 = new Branch({
    institution_id: institution._id,
    branch_name: "Ematix - Chrompet",
    address: "Chrompet, Chennai",
    location: "Chrompet",
    managerName: "Branch Manager 1",
    managerEmail: "bm1@ematix.com",
    contactPhone: "9876543210",
    classes: ["LKG", "UKG", "1st Std", "2nd Std"],
    feesText: "LKG:20000, UKG:21000, 1st Std:25000, 2nd Std:26000",
  });
  await branch1.save();

  const branch2 = new Branch({
    institution_id: institution._id,
    branch_name: "Ematix - Tambaram",
    address: "Tambaram, Chennai",
    location: "Tambaram",
    managerName: "Branch Manager 2",
    managerEmail: "bm2@ematix.com",
    contactPhone: "9876500000",
    classes: ["1st Std", "2nd Std", "3rd Std"],
    feesText: "1st Std:24000, 2nd Std:25500, 3rd Std:27000",
  });
  await branch2.save();

  const branchAdmin1 = new User({
    name: "Branch Admin 1",
    email: branch1.managerEmail,
    role: "branch_admin",
    status: "active",
    institution_id: institution._id,
    branch_id: branch1._id,
  });
  await branchAdmin1.setPassword("Branch@123");
  await branchAdmin1.save();

  const branchAdmin2 = new User({
    name: "Branch Admin 2",
    email: branch2.managerEmail,
    role: "branch_admin",
    status: "active",
    institution_id: institution._id,
    branch_id: branch2._id,
  });
  await branchAdmin2.setPassword("Branch@123");
  await branchAdmin2.save();

  const studentsB1 = [
    { name: "Student A", className: "LKG" },
    { name: "Student B", className: "LKG" },
    { name: "Student C", className: "1st Std" },
  ].map(
    (s) =>
      new Student({
        name: s.name,
        className: s.className,
        institution_id: institution._id,
        branch_id: branch1._id,
      })
  );
  await Student.insertMany(studentsB1);

  const studentsB2 = [
    { name: "Student D", className: "1st Std" },
    { name: "Student E", className: "2nd Std" },
  ].map(
    (s) =>
      new Student({
        name: s.name,
        className: s.className,
        institution_id: institution._id,
        branch_id: branch2._id,
      })
  );
  await Student.insertMany(studentsB2);

  const feesB1 = [
    { studentName: "Student A", amount: 20000 },
    { studentName: "Student B", amount: 20000 },
    { studentName: "Student C", amount: 25000 },
  ].map(
    (f) =>
      new FeePayment({
        studentName: f.studentName,
        amount: f.amount,
        institution_id: institution._id,
        branch_id: branch1._id,
      })
  );
  await FeePayment.insertMany(feesB1);

  const feesB2 = [
    { studentName: "Student D", amount: 24000 },
    { studentName: "Student E", amount: 25500 },
  ].map(
    (f) =>
      new FeePayment({
        studentName: f.studentName,
        amount: f.amount,
        institution_id: institution._id,
        branch_id: branch2._id,
      })
  );
  await FeePayment.insertMany(feesB2);

  console.log("Seed data inserted:");
  console.log("- company admin: company@erp.com / Admin@123");
  console.log("- institution admin: inst@ematix.com / Admin@123");
  console.log("- branch admin 1: bm1@ematix.com / Branch@123");
  console.log("- branch admin 2: bm2@ematix.com / Branch@123");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("SEED ERROR", err);
  process.exit(1);
});
// dont use this 
