const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/staffsync';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      Announcement.deleteMany({}),
      Training.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    // Common default password for demo accounts
    const demoPassword = 'Password123!';

    // 1. HR User
    const hrUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'hr@staffsync.com',
      password: demoPassword,
      role: 'HR',
      isActive: true,
    });

    const hrEmployee = await Employee.create({
      employeeId: 'EMP-0001',
      user: hrUser._id,
      fullName: 'Sarah Jenkins',
      department: 'Human Resources',
      jobTitle: 'Chief Human Resources Officer',
      phoneNumber: '+1 (555) 123-4567',
      joiningDate: new Date('2022-01-15'),
      employmentStatus: 'Active',
      salary: 120000,
      address: {
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Robert Jenkins',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543',
      },
    });
    hrUser.employeeProfile = hrEmployee._id;
    await hrUser.save();

    // 2. Manager User
    const managerUser = await User.create({
      name: 'Michael Scott',
      email: 'manager@staffsync.com',
      password: demoPassword,
      role: 'Manager',
      isActive: true,
    });

    const managerEmployee = await Employee.create({
      employeeId: 'EMP-0002',
      user: managerUser._id,
      fullName: 'Michael Scott',
      department: 'Engineering',
      jobTitle: 'VP of Engineering',
      phoneNumber: '+1 (555) 234-5678',
      joiningDate: new Date('2022-03-01'),
      employmentStatus: 'Active',
      salary: 110000,
      address: {
        street: '200 Tech Boulevard',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94107',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Holly Scott',
        relationship: 'Spouse',
        phone: '+1 (555) 876-5432',
      },
    });
    managerUser.employeeProfile = managerEmployee._id;
    await managerUser.save();

    // 3. Employee User (Reports to Manager)
    const employeeUser = await User.create({
      name: 'Alex Morgan',
      email: 'employee@staffsync.com',
      password: demoPassword,
      role: 'Employee',
      isActive: true,
    });

    const employeeEmployee = await Employee.create({
      employeeId: 'EMP-0003',
      user: employeeUser._id,
      fullName: 'Alex Morgan',
      department: 'Engineering',
      jobTitle: 'Senior Full Stack Engineer',
      phoneNumber: '+1 (555) 345-6789',
      joiningDate: new Date('2023-06-12'),
      employmentStatus: 'Active',
      manager: managerEmployee._id,
      salary: 95000,
      address: {
        street: '450 Bay Street',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94607',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Elena Morgan',
        relationship: 'Sister',
        phone: '+1 (555) 765-4321',
      },
    });
    employeeUser.employeeProfile = employeeEmployee._id;
    await employeeUser.save();

    // 4. Second Employee (Reports to Manager)
    const devUser = await User.create({
      name: 'Priya Patel',
      email: 'priya@staffsync.com',
      password: demoPassword,
      role: 'Employee',
      isActive: true,
    });

    const devEmployee = await Employee.create({
      employeeId: 'EMP-0004',
      user: devUser._id,
      fullName: 'Priya Patel',
      department: 'Engineering',
      jobTitle: 'Frontend Engineer',
      phoneNumber: '+1 (555) 456-7890',
      joiningDate: new Date('2023-09-01'),
      employmentStatus: 'Active',
      manager: managerEmployee._id,
      salary: 85000,
      address: {
        street: '12 Mission Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'USA',
      },
    });
    devUser.employeeProfile = devEmployee._id;
    await devUser.save();

    // 5. Marketing Employee
    const mktgUser = await User.create({
      name: 'David Kim',
      email: 'david@staffsync.com',
      password: demoPassword,
      role: 'Employee',
      isActive: true,
    });

    const mktgEmployee = await Employee.create({
      employeeId: 'EMP-0005',
      user: mktgUser._id,
      fullName: 'David Kim',
      department: 'Marketing',
      jobTitle: 'Digital Marketing Strategist',
      phoneNumber: '+1 (555) 567-8901',
      joiningDate: new Date('2023-11-15'),
      employmentStatus: 'Active',
      salary: 78000,
      address: {
        street: '78 Pinecrest Ave',
        city: 'Berkeley',
        state: 'CA',
        zipCode: '94704',
      },
    });
    mktgUser.employeeProfile = mktgEmployee._id;
    await mktgUser.save();

    console.log('[Seed] Seeding attendance records...');
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Today's attendance
    await Attendance.create([
      {
        employee: employeeEmployee._id,
        date: new Date(todayStr),
        dateString: todayStr,
        checkIn: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        status: 'Present',
        notes: 'Checked in on time at desk.',
      },
      {
        employee: managerEmployee._id,
        date: new Date(todayStr),
        dateString: todayStr,
        checkIn: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'Present',
        notes: 'Morning engineering sync.',
      },
      {
        employee: hrEmployee._id,
        date: new Date(todayStr),
        dateString: todayStr,
        checkIn: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'Present',
        notes: 'HR policy review.',
      },
      // Yesterday's complete attendance
      {
        employee: employeeEmployee._id,
        date: new Date(yesterdayStr),
        dateString: yesterdayStr,
        checkIn: new Date(yesterday.setHours(9, 0, 0, 0)),
        checkOut: new Date(yesterday.setHours(17, 30, 0, 0)),
        workDurationMinutes: 510,
        status: 'Present',
        notes: 'Sprint planning and development.',
      },
    ]);

    console.log('[Seed] Seeding leave applications...');
    await Leave.create([
      {
        employee: employeeEmployee._id,
        leaveType: 'Annual',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        daysCount: 3,
        reason: 'Family vacation and personal travel.',
        status: 'Pending',
      },
      {
        employee: devEmployee._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        daysCount: 2,
        reason: 'Severe flu and doctor advised rest.',
        status: 'Approved',
        reviewedBy: managerUser._id,
        reviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewerComments: 'Approved. Get well soon!',
      },
      {
        employee: mktgEmployee._id,
        leaveType: 'Casual',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        daysCount: 2,
        reason: 'Personal work and home moving.',
        status: 'Pending',
      },
    ]);

    console.log('[Seed] Seeding announcements...');
    await Announcement.create([
      {
        title: 'Welcome to StaffSync HRMS Platform!',
        content: 'We are thrilled to officially launch StaffSync for all team members. Use this platform to manage your attendance, leave applications, trainings, and profile updates.',
        createdBy: hrUser._id,
        audience: 'All',
        publicationStatus: 'Published',
        publicationDate: new Date(),
        priority: 'High',
      },
      {
        title: 'Q4 Performance Review Cycle & Goal Setting',
        content: 'Please ensure your Q4 performance goals and deliverables are documented with your managers before the end of next week.',
        createdBy: hrUser._id,
        audience: 'All',
        publicationStatus: 'Published',
        publicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'Normal',
      },
      {
        title: 'Engineering Architecture Sync & Tech Stack Upgrade',
        content: 'All engineering team members are invited to our architecture review meeting this Thursday at 2:00 PM PST in Conference Room A.',
        createdBy: managerUser._id,
        audience: 'Engineering',
        publicationStatus: 'Published',
        publicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: 'Normal',
      },
    ]);

    console.log('[Seed] Seeding training programs...');
    await Training.create([
      {
        title: 'Modern Full-Stack Development with React & Node.js',
        description: 'Comprehensive hands-on workshop covering RESTful APIs, modern frontend architecture, state management, and cloud deployments.',
        trainer: 'Dr. Sarah Connor',
        department: 'Engineering',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'Upcoming',
        maxParticipants: 25,
        participants: [
          {
            employee: employeeEmployee._id,
            enrolledAt: new Date(),
            status: 'Enrolled',
          },
        ],
        createdBy: hrUser._id,
      },
      {
        title: 'Workplace Cybersecurity & Data Privacy Standards',
        description: 'Essential compliance training on password hygiene, phishing defense, data loss prevention, and secure development standards.',
        trainer: 'Robert Langdon (CyberSec Lead)',
        department: 'All',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        status: 'Upcoming',
        maxParticipants: 50,
        participants: [
          {
            employee: devEmployee._id,
            enrolledAt: new Date(),
            status: 'Enrolled',
          },
          {
            employee: mktgEmployee._id,
            enrolledAt: new Date(),
            status: 'Enrolled',
          },
        ],
        createdBy: hrUser._id,
      },
    ]);

    console.log('[Seed] Seeding notifications...');
    await Notification.create([
      {
        recipient: employeeUser._id,
        title: 'Welcome to StaffSync',
        message: 'Your employee profile has been linked and activated. You can now check in, view announcements, and apply for leaves.',
        type: 'System',
        link: '/profile',
        isRead: false,
      },
      {
        recipient: employeeUser._id,
        title: 'New Announcement Published',
        message: 'HR has published: "Welcome to StaffSync HRMS Platform!"',
        type: 'Announcement',
        link: '/announcements',
        isRead: false,
      },
      {
        recipient: managerUser._id,
        title: 'New Leave Request Pending Approval',
        message: 'Alex Morgan submitted an Annual leave request (3 days) awaiting your review.',
        type: 'Leave',
        link: '/leaves',
        isRead: false,
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ StaffSync Database Seeded Successfully!');
    console.log('======================================================');
    console.log('Demo Accounts:');
    console.log('  1. HR Account:');
    console.log('     Email:    hr@staffsync.com');
    console.log('     Password: Password123!');
    console.log('     Role:     HR\n');
    console.log('  2. Manager Account:');
    console.log('     Email:    manager@staffsync.com');
    console.log('     Password: Password123!');
    console.log('     Role:     Manager\n');
    console.log('  3. Employee Account:');
    console.log('     Email:    employee@staffsync.com');
    console.log('     Password: Password123!');
    console.log('     Role:     Employee');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();
