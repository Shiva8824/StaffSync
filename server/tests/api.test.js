const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');

let hrToken = '';
let managerToken = '';
let employeeToken = '';
let testEmpDoc = null;

// Ensure database connection and clean test state before running tests
test.before(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/staffsync';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Ensure test users exist
  const hrUser = await User.findOne({ email: 'hr@staffsync.com' });
  if (!hrUser) {
    // If not seeded, run seed script or create
    const { execSync } = require('child_process');
    execSync('npm run seed', { cwd: __dirname + '/..' });
  }

  // Clear any existing attendance for today for Alex Morgan so check-in/out tests are deterministic
  const empUser = await User.findOne({ email: 'employee@staffsync.com' }).populate('employeeProfile');
  if (empUser && empUser.employeeProfile) {
    testEmpDoc = empUser.employeeProfile;
    const todayStr = new Date().toISOString().slice(0, 10);
    await Attendance.deleteMany({ employee: testEmpDoc._id, dateString: todayStr });
    // Also delete any test leaves created with December dates
    await Leave.deleteMany({ reason: /test|conference|Invalid trip/i });
  }
});

test.after(async () => {
  await mongoose.disconnect();
});

test('Health Check: GET /api/health returns 200 OK and healthy status', async () => {
  const response = await request(app).get('/api/health');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(typeof response.body.system.uptime, 'number');
  assert.strictEqual(response.body.message, 'StaffSync HRMS API is online and healthy');
});

test('Auth: Obtain tokens for HR, Manager, and Employee', async () => {
  const hrRes = await request(app).post('/api/auth/login').send({
    email: 'hr@staffsync.com',
    password: 'Password123!',
  });
  assert.strictEqual(hrRes.status, 200);
  hrToken = hrRes.body.token;

  const mgrRes = await request(app).post('/api/auth/login').send({
    email: 'manager@staffsync.com',
    password: 'Password123!',
  });
  assert.strictEqual(mgrRes.status, 200);
  managerToken = mgrRes.body.token;

  const empRes = await request(app).post('/api/auth/login').send({
    email: 'employee@staffsync.com',
    password: 'Password123!',
  });
  assert.strictEqual(empRes.status, 200);
  employeeToken = empRes.body.token;
});

test('Employees: HR can create a new employee with user account', async () => {
  const uniqueEmail = `qa_hire_${Date.now()}@staffsync.com`;
  const response = await request(app)
    .post('/api/employees')
    .set('Authorization', `Bearer ${hrToken}`)
    .send({
      fullName: 'Samantha Ray',
      email: uniqueEmail,
      department: 'Engineering',
      jobTitle: 'QA Automation Engineer',
      salary: 75000,
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.employee.fullName, 'Samantha Ray');
  assert.ok(response.body.employee.employeeId.startsWith('EMP-'));
});

test('Employees: Non-HR (Employee) is forbidden from creating employee records', async () => {
  const response = await request(app)
    .post('/api/employees')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({
      fullName: 'Illegal Hire',
      email: `illegal_${Date.now()}@staffsync.com`,
      department: 'Engineering',
      jobTitle: 'Hacker',
    });

  assert.strictEqual(response.status, 403);
  assert.strictEqual(response.body.success, false);
});

test('Employees: Employee only receives their own record when listing employees', async () => {
  const response = await request(app)
    .get('/api/employees')
    .set('Authorization', `Bearer ${employeeToken}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.employees.length, 1);
  assert.strictEqual(response.body.employees[0].fullName, 'Alex Morgan');
});

test('Attendance: Employee check-in, duplicate prevention, and check-out cycle', async () => {
  // 1. Initial check-in should succeed
  const checkInRes = await request(app)
    .post('/api/attendance/check-in')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ notes: 'Morning check in test' });

  assert.strictEqual(checkInRes.status, 201);
  assert.strictEqual(checkInRes.body.success, true);

  // 2. Duplicate check-in on the same day must be rejected
  const duplicateCheckIn = await request(app)
    .post('/api/attendance/check-in')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ notes: 'Duplicate check in' });

  assert.strictEqual(duplicateCheckIn.status, 400);
  assert.match(duplicateCheckIn.body.message, /already checked in/i);

  // 3. Check-out should succeed
  const checkOutRes = await request(app)
    .post('/api/attendance/check-out')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ notes: 'Daily wrap-up and commits pushed' });

  assert.strictEqual(checkOutRes.status, 200);
  assert.strictEqual(checkOutRes.body.success, true);
  assert.ok(checkOutRes.body.attendance.checkOut);

  // 4. Repeated check-out must be rejected
  const secondCheckOut = await request(app)
    .post('/api/attendance/check-out')
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.strictEqual(secondCheckOut.status, 400);
});

test('Leaves: Reject leave application when end date is earlier than start date', async () => {
  const response = await request(app)
    .post('/api/leaves')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({
      leaveType: 'Annual',
      startDate: '2026-11-20',
      endDate: '2026-11-15',
      reason: 'Invalid trip',
    });

  assert.strictEqual(response.status, 400);
  assert.match(response.body.message, /earlier than start date/i);
});

test('Leaves: Reject overlapping leave applications', async () => {
  const futureStart = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const futureEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const response = await request(app)
    .post('/api/leaves')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({
      leaveType: 'Casual',
      startDate: futureStart,
      endDate: futureEnd,
      reason: 'Doctor appointment',
    });

  assert.strictEqual(response.status, 400);
  assert.match(response.body.message, /overlapping/i);
});

test('Leaves: Prevent self-approval of leave request', async () => {
  // Use unique future dates for manager self-approval test
  const uniqueOffset = Math.floor(Math.random() * 50) + 30;
  const leaveStart = new Date(Date.now() + uniqueOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const leaveEnd = new Date(Date.now() + (uniqueOffset + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const applyRes = await request(app)
    .post('/api/leaves')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      leaveType: 'Casual',
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: 'Personal test conference',
    });

  assert.strictEqual(applyRes.status, 201);
  const leaveId = applyRes.body.leave._id;

  const reviewRes = await request(app)
    .patch(`/api/leaves/${leaveId}/review`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      status: 'Approved',
      reviewerComments: 'Self approving',
    });

  assert.strictEqual(reviewRes.status, 403);
  assert.match(reviewRes.body.message, /cannot approve or reject your own/i);
});

test('Announcements: HR can create company-wide announcement', async () => {
  const res = await request(app)
    .post('/api/announcements')
    .set('Authorization', `Bearer ${hrToken}`)
    .send({
      title: 'Company Holiday Schedule',
      content: 'The office will be closed on upcoming national holidays.',
      audience: 'All',
      priority: 'Normal',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.announcement.title, 'Company Holiday Schedule');
});

test('Announcements: Non-HR cannot create company-wide announcement', async () => {
  const res = await request(app)
    .post('/api/announcements')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({
      title: 'Unauthorized announcement',
      content: 'Spam text',
      audience: 'All',
    });

  assert.strictEqual(res.status, 403);
});

test('Trainings: Prevent duplicate enrollment in training', async () => {
  const getRes = await request(app)
    .get('/api/trainings')
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.strictEqual(getRes.status, 200);
  const training = getRes.body.trainings[0];

  const enrollRes = await request(app)
    .post(`/api/trainings/${training._id}/enroll`)
    .set('Authorization', `Bearer ${employeeToken}`);

  assert.strictEqual(enrollRes.status, 400);
  assert.match(enrollRes.body.message, /already enrolled/i);
});

test('Notifications: User can fetch only their own notifications and mark them as read', async () => {
  const getRes = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${employeeToken}`);

  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.success, true);
  assert.ok(Array.isArray(getRes.body.notifications));

  if (getRes.body.notifications.length > 0) {
    const notifId = getRes.body.notifications[0]._id;
    const markRes = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${employeeToken}`);

    assert.strictEqual(markRes.status, 200);
    assert.strictEqual(markRes.body.notification.isRead, true);
  }
});

test('Dashboard: Returns live role-specific stats for HR and Employee', async () => {
  const hrDash = await request(app)
    .get('/api/dashboard')
    .set('Authorization', `Bearer ${hrToken}`);
  assert.strictEqual(hrDash.status, 200);
  assert.strictEqual(hrDash.body.role, 'HR');
  assert.ok(hrDash.body.data.metrics.totalEmployees > 0);

  const empDash = await request(app)
    .get('/api/dashboard')
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.strictEqual(empDash.status, 200);
  assert.strictEqual(empDash.body.role, 'Employee');
  assert.ok(empDash.body.data.employeeProfile);
});
