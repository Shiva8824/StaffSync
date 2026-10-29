const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper to get formatted date string (YYYY-MM-DD)
const getTodayDateString = (dateObj = new Date()) => {
  return dateObj.toISOString().slice(0, 10);
};

// @desc    Check-in for today
// @route   POST /api/attendance/check-in
// @access  Private (Employee, Manager, HR)
const checkIn = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile found for this user account',
      });
    }

    const employeeId = req.user.employeeProfile._id;
    const now = new Date();
    const dateString = getTodayDateString(now);

    // Check for existing check-in today
    const existing = await Attendance.findOne({
      employee: employeeId,
      dateString,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today',
        attendance: existing,
      });
    }

    // Determine status (if check-in is after 09:30 AM local time, flag as Late)
    const checkInHour = now.getHours();
    const checkInMinutes = now.getMinutes();
    let status = 'Present';
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinutes > 30)) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      employee: employeeId,
      date: new Date(dateString),
      dateString,
      checkIn: now,
      status,
      notes: req.body.notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Checked in successfully as ${status}`,
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today',
      });
    }
    next(error);
  }
};

// @desc    Check-out for today
// @route   POST /api/attendance/check-out
// @access  Private (Employee, Manager, HR)
const checkOut = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile found',
      });
    }

    const employeeId = req.user.employeeProfile._id;
    const dateString = getTodayDateString();

    const attendance = await Attendance.findOne({
      employee: employeeId,
      dateString,
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out without an active check-in for today',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out for today',
        attendance,
      });
    }

    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - attendance.checkIn.getTime()) / (1000 * 60));

    attendance.checkOut = now;
    attendance.workDurationMinutes = durationMinutes;

    // If work duration is less than 4 hours (240 mins), mark as Half-Day
    if (durationMinutes < 240 && attendance.status !== 'Late') {
      attendance.status = 'Half-Day';
    }

    if (req.body.notes) {
      attendance.notes = attendance.notes ? `${attendance.notes} | ${req.body.notes}` : req.body.notes;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in employee today's attendance status
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(200).json({
        success: true,
        checkedIn: false,
        checkedOut: false,
        attendance: null,
      });
    }

    const dateString = getTodayDateString();
    const attendance = await Attendance.findOne({
      employee: req.user.employeeProfile._id,
      dateString,
    });

    res.status(200).json({
      success: true,
      checkedIn: !!attendance,
      checkedOut: !!(attendance && attendance.checkOut),
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personal attendance history
// @route   GET /api/attendance/my-history
// @access  Private
const getMyAttendanceHistory = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(200).json({ success: true, count: 0, history: [] });
    }

    const { startDate, endDate, page = 1, limit = 15 } = req.query;
    const query = { employee: req.user.employeeProfile._id };

    if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.dateString = { $gte: startDate };
    } else if (endDate) {
      query.dateString = { $lte: endDate };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Attendance.countDocuments(query);
    const history = await Attendance.find(query)
      .sort({ dateString: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team attendance for Manager
// @route   GET /api/attendance/team
// @access  Private (Manager only)
const getTeamAttendance = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(200).json({ success: true, count: 0, teamAttendance: [] });
    }

    const dateString = req.query.date || getTodayDateString();

    // Find team members reporting to this manager
    const teamMembers = await Employee.find({
      manager: req.user.employeeProfile._id,
      employmentStatus: 'Active',
    }).select('_id fullName employeeId department jobTitle');

    const teamMemberIds = teamMembers.map((m) => m._id);

    // Fetch attendance for these team members
    const attendanceRecords = await Attendance.find({
      employee: { $in: teamMemberIds },
      dateString,
    }).populate('employee', 'fullName employeeId department jobTitle');

    // Combine list to show who is present, late, or absent
    const recordsMap = new Map();
    attendanceRecords.forEach((rec) => {
      recordsMap.set(rec.employee._id.toString(), rec);
    });

    const report = teamMembers.map((member) => {
      const record = recordsMap.get(member._id.toString());
      return {
        employee: member,
        hasAttendance: !!record,
        status: record ? record.status : 'Absent',
        checkIn: record ? record.checkIn : null,
        checkOut: record ? record.checkOut : null,
        durationMinutes: record ? record.workDurationMinutes : 0,
        notes: record ? record.notes : '',
      };
    });

    res.status(200).json({
      success: true,
      date: dateString,
      teamSize: teamMembers.length,
      presentCount: attendanceRecords.length,
      absentCount: teamMembers.length - attendanceRecords.length,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance for HR
// @route   GET /api/attendance/all
// @access  Private (HR only)
const getAllAttendance = async (req, res, next) => {
  try {
    const dateString = req.query.date || getTodayDateString();
    const department = req.query.department;

    // Filter employees
    const empQuery = { employmentStatus: 'Active' };
    if (department && department !== 'All') {
      empQuery.department = department;
    }

    const activeEmployees = await Employee.find(empQuery)
      .select('_id fullName employeeId department jobTitle')
      .populate('manager', 'fullName');

    const empIds = activeEmployees.map((e) => e._id);

    const attendanceRecords = await Attendance.find({
      employee: { $in: empIds },
      dateString,
    }).populate('employee', 'fullName employeeId department jobTitle');

    const recordsMap = new Map();
    attendanceRecords.forEach((rec) => {
      if (rec.employee) {
        recordsMap.set(rec.employee._id.toString(), rec);
      }
    });

    const records = activeEmployees.map((emp) => {
      const rec = recordsMap.get(emp._id.toString());
      return {
        employee: emp,
        hasAttendance: !!rec,
        status: rec ? rec.status : 'Absent',
        checkIn: rec ? rec.checkIn : null,
        checkOut: rec ? rec.checkOut : null,
        durationMinutes: rec ? rec.workDurationMinutes : 0,
        notes: rec ? rec.notes : '',
      };
    });

    const summary = {
      total: activeEmployees.length,
      present: attendanceRecords.filter((r) => r.status === 'Present').length,
      late: attendanceRecords.filter((r) => r.status === 'Late').length,
      halfDay: attendanceRecords.filter((r) => r.status === 'Half-Day').length,
      absent: activeEmployees.length - attendanceRecords.length,
    };

    res.status(200).json({
      success: true,
      date: dateString,
      summary,
      records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendanceHistory,
  getTeamAttendance,
  getAllAttendance,
};
