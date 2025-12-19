// Seed Script for Parent Module Sample Data
// Run with: node seedParentData.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models (named exports)
import { Student } from './models/Student.js';
import { FeeStructure } from './models/FeeStructure.js';
import { FeePayment } from './models/FeePayment.js';
import { Branch } from './models/Branch.js';
import { Institution } from './models/Institution.js';

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/first-crop_db';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL);
    console.log('✓ Connected to MongoDB');

    // Ensure institution exists first (required by Branch schema)
    let institution = await Institution.findOne();
    if (!institution) {
      console.log('⚠️  No institution found. Creating default institution...');
      institution = await Institution.create({
        name: 'Global Education Institute',
        institution_id: 'INST-DEFAULT-001',
        location: 'Delhi'
      });
    }

    // Ensure branch exists and is linked to institution
    let branch = await Branch.findOne({ institution_id: institution._id });
    if (!branch) {
      console.log('⚠️  No branch found. Creating default branch...');
      branch = await Branch.create({
        institution_id: institution._id,
        branch_name: 'Main Branch',
        address: 'Delhi',
        location: 'Delhi',
        managerName: 'John Doe',
        managerEmail: 'manager@default.com',
        contactPhone: '9876543210',
        classes: ['10A', '9B', '11A']
      });
    }

    console.log(`Using Institution: ${institution.name} (${institution._id})`);
    console.log(`Using Branch: ${branch.branch_name} (${branch._id})`);

    // Clear existing sample data
    console.log('\n🧹 Clearing old sample data...');
    await Student.deleteMany({ admissionNumber: { $regex: '^ADM-2024-' } });
    await FeePayment.deleteMany({ studentName: { $in: ['Aarav Kumar', 'Priya Singh', 'Arjun Patel', 'Divya Sharma'] } });
    console.log('✓ Old data cleared');

    // Insert Students
    console.log('\n📚 Creating sample students...');
    const students = await Student.insertMany([
      {
        name: 'Aarav Kumar',
        class: '10A',
        section: 'A',
        rollNo: '15',
        parentName: 'Rajesh Kumar',
        phoneNo: '9876543210',
        admissionNumber: 'ADM-2024-001',
        academicYear: '2024-2025',
        status: 'active',
        address: '123 Main Street, Delhi',
        aadharCardNumber: '1234-5678-9012',
        rationCardNumber: 'RC-001234',
        customNote: 'Allergic to peanuts, needs extra support in mathematics',
        branch_id: branch._id,
        institution_id: institution._id
      },
      {
        name: 'Priya Singh',
        class: '9B',
        section: 'B',
        rollNo: '28',
        parentName: 'Vikram Singh',
        phoneNo: '9123456789',
        admissionNumber: 'ADM-2024-002',
        academicYear: '2024-2025',
        status: 'active',
        address: '456 Green Park, Mumbai',
        aadharCardNumber: '2345-6789-0123',
        rationCardNumber: 'RC-001235',
        customNote: 'Excellent in sports and music',
        branch_id: branch._id,
        institution_id: institution._id
      },
      {
        name: 'Arjun Patel',
        class: '11A',
        section: 'A',
        rollNo: '32',
        parentName: 'Ramesh Patel',
        phoneNo: '8765432109',
        admissionNumber: 'ADM-2024-003',
        academicYear: '2024-2025',
        status: 'active',
        address: '789 Tech Park, Bangalore',
        aadharCardNumber: '3456-7890-1234',
        rationCardNumber: 'RC-001236',
        customNote: 'Science stream student, aspires to be engineer',
        branch_id: branch._id,
        institution_id: institution._id
      },
      {
        name: 'Divya Sharma',
        class: '10A',
        section: 'A',
        rollNo: '22',
        parentName: 'Suresh Sharma',
        phoneNo: '9988776655',
        admissionNumber: 'ADM-2024-004',
        academicYear: '2024-2025',
        status: 'active',
        address: '321 Maple Avenue, Chennai',
        aadharCardNumber: '4567-8901-2345',
        rationCardNumber: 'RC-001237',
        customNote: 'Arts stream, strong in languages',
        branch_id: branch._id,
        institution_id: institution._id
      }
    ]);
    console.log(`✓ Created ${students.length} students`);
    students.forEach(s => console.log(`  - ${s.name} (Phone: ${s.phoneNo})`));

    // Insert Fee Structures
    console.log('\n💰 Creating fee structures...');
    const feeStructures = await FeeStructure.insertMany([
      {
        branch_id: branch._id,
        institution_id: institution._id,
        class: '10A',
        categories: {
          'Tuition Fee': 5000,
          'Transport Fee': 1000,
          'Sports Fee': 500,
          'Technology Fee': 300,
          'Library Fee': 200
        }
      },
      {
        branch_id: branch._id,
        institution_id: institution._id,
        class: '9B',
        categories: {
          'Tuition Fee': 4500,
          'Transport Fee': 1000,
          'Sports Fee': 500,
          'Technology Fee': 300,
          'Library Fee': 200
        }
      },
      {
        branch_id: branch._id,
        institution_id: institution._id,
        class: '11A',
        categories: {
          'Tuition Fee': 6000,
          'Transport Fee': 1200,
          'Sports Fee': 600,
          'Technology Fee': 400,
          'Library Fee': 250
        }
      }
    ]);
    console.log(`✓ Created ${feeStructures.length} fee structures`);

    // Insert Fee Payments
    console.log('\n📝 Creating payment records...');
    const payments = await FeePayment.insertMany([
      // Aarav Kumar payments
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[0]._id,
        studentName: 'Aarav Kumar',
        class: '10A',
        category: 'Tuition Fee',
        amount: 5000,
        mode: 'cash',
        note: 'September tuition fees',
        date: new Date('2024-09-15')
      },
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[0]._id,
        studentName: 'Aarav Kumar',
        class: '10A',
        category: 'Transport Fee',
        amount: 1000,
        mode: 'cheque',
        note: 'September transport fees',
        date: new Date('2024-09-20')
      },
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[0]._id,
        studentName: 'Aarav Kumar',
        class: '10A',
        category: 'Sports Fee',
        amount: 500,
        mode: 'cash',
        note: 'Sports activities fee',
        date: new Date('2024-10-05')
      },
      // Priya Singh payments
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[1]._id,
        studentName: 'Priya Singh',
        class: '9B',
        category: 'Tuition Fee',
        amount: 4500,
        mode: 'bank transfer',
        note: 'September tuition fees',
        date: new Date('2024-09-10')
      },
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[1]._id,
        studentName: 'Priya Singh',
        class: '9B',
        category: 'Transport Fee',
        amount: 1000,
        mode: 'cash',
        note: 'Transport fees',
        date: new Date('2024-10-01')
      },
      // Arjun Patel payments
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[2]._id,
        studentName: 'Arjun Patel',
        class: '11A',
        category: 'Tuition Fee',
        amount: 6000,
        mode: 'cash',
        note: 'September tuition fees',
        date: new Date('2024-09-12')
      },
      // Divya Sharma payments
      {
        branch_id: branch._id,
        institution_id: institution._id,
        studentId: students[3]._id,
        studentName: 'Divya Sharma',
        class: '10A',
        category: 'Tuition Fee',
        amount: 5000,
        mode: 'bank transfer',
        note: 'Complete tuition payment',
        date: new Date('2024-09-18')
      }
    ]);
    console.log(`✓ Created ${payments.length} payment records`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SAMPLE DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nYou can now test the parent module with these credentials:\n');
    students.forEach((student, index) => {
      console.log(`${index + 1}. Student: ${student.name}`);
      console.log(`   Phone: ${student.phoneNo}`);
      console.log(`   Parent: ${student.parentName}`);
      console.log('');
    });
    console.log('Navigate to: http://localhost:3000/login');
    console.log('Click "Login as Parent" and use the credentials above\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    try {
      await mongoose.connection.close();
    } catch (closeErr) {
      console.error('❌ Error closing Mongo connection:', closeErr);
    }
    process.exit(1);
  }
};

seedDatabase();
