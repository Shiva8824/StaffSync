const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');
const Notification = require('../models/Notification');

// Helper to get today's date string YYYY-MM-DD
const getTodayDateString = (dateObj = new Date()) => {
  return dateObj.toISOString().slice(0, 10);
};

// @desc    Get role-specific dashboard statistics and summaries
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const role = req.user.role;
    const todayStr = getTodayDateString();

    if (role === 'HR') {
      // 1. HR Dashboard Statistics
      const totalEmployees = await Employee.countDocuments();
      const activeEmployees = await Employee.countDocuments({ employmentStatus: 'Active' });
      const onLeaveEmployees = await Employee.countDocuments({ employmentStatus: 'On Leave' });

      // Department distribution
      const departmentDistribution = await Employee.aggregate([
        { $match: { employmentStatus: 'Active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Today's attendance summary across all active employees
      const activeEmployeeDocs = await Employee.find({ employmentStatus: 'Active' }).select('_id');
      const activeIds = activeEmployeeDocs.map((e) => e._id);

      const todayAttendance = await Attendance.find({
        employee: { $in: activeIds },
        dateString: todayStr,
      });

      const attendanceSummary = {
        total: activeEmployees,
        present: todayAttendance.filter((a) => a.status === 'Present').length,
        late: todayAttendance.filter((a) => a.status === 'Late').length,
        halfDay: todayAttendance.filter((a) => a.status === 'Half-Day').length,
        absent: Math.max(0, activeEmployees - todayAttendance.length),
      };

      // Organization-wide pending leaves
      const pendingLeavesCount = await Leave.countDocuments({ status: 'Pending' });
      const recentPendingLeaves = await Leave.find({ status: 'Pending' })
        .populate('employee', 'fullName employeeId department jobTitle')
        .sort({ createdAt: -1 })
        .limit(5);

      // Active announcements
      const recentAnnouncements = await Announcement.find({ publicationStatus: 'Published' })
        .sort({ publicationDate: -1 })
        .limit(4);

      // Active trainings
      const activeTrainingsCount = await Training.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } });

      return res.status(200).json({
        success: true,
        role: 'HR',
        data: {
          metrics: {
            totalEmployees,
            activeEmployees,
            onLeaveEmployees,
            pendingLeaves: pendingLeavesCount,
            activeTrainings: activeTrainingsCount,
            todayPresent: attendanceSummary.present + attendanceSummary.late,
            todayAbsent: attendanceSummary.absent,
          },
          departmentDistribution,
          attendanceSummary,
          recentPendingLeaves,
          recentAnnouncements,
        },
      });
    } else if (role === 'Manager') {
      // 2. Manager Dashboard Statistics
      const managerEmployee = req.user.employeeProfile;
      if (!managerEmployee) {
        return res.status(200).json({
          success: true,
          role: 'Manager',
          data: {
            teamSize: 0,
            teamAttendance: { present: 0, late: 0, absent: 0 },
            pendingLeaves: [],
            teamMembers: [],
            recentAnnouncements: [],
          },
        });
      }

      // Team members reporting to this manager
      const teamMembers = await Employee.find({
        manager: managerEmployee._id,
        employmentStatus: 'Active',
      }).select('fullName employeeId department jobTitle phoneNumber joiningDate');

      const teamIds = teamMembers.map((m) => m._id);

      // Team attendance today
      const todayAttendance = await Attendance.find({
        employee: { $in: teamIds },
        dateString: todayStr,
      }).populate('employee', 'fullName employeeId');

      const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
      const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;
      const absentCount = Math.max(0, teamMembers.length - todayAttendance.length);

      // Pending team leave requests
      const pendingLeaves = await Leave.find({
        employee: { $in: teamIds },
        status: 'Pending',
      })
        .populate('employee', 'fullName employeeId department jobTitle')
        .sort({ createdAt: -1 });

      // Manager's own today attendance
      const managerTodayAttendance = await Attendance.findOne({
        employee: managerEmployee._id,
        dateString: todayStr,
      });

      // Announcements relevant to Manager
      const announcements = await Announcement.find({
        publicationStatus: 'Published',
        $or: [{ audience: 'All' }, { audience: 'Manager' }, { audience: managerEmployee.department }],
      })
        .sort({ publicationDate: -1 })
        .limit(4);

      // Trainings relevant to team
      const teamTrainings = await Training.find({
        status: { $in: ['Upcoming', 'Ongoing'] },
        $or: [{ department: 'All' }, { department: managerEmployee.department }],
      }).limit(4);

      return res.status(200).json({
        success: true,
        role: 'Manager',
        data: {
          metrics: {
            teamSize: teamMembers.length,
            presentToday: presentCount + lateCount,
            absentToday: absentCount,
            pendingLeaveApprovals: pendingLeaves.length,
          },
          teamAttendance: {
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            records: todayAttendance,
          },
          managerTodayAttendance,
          pendingLeaves,
          teamMembers,
          recentAnnouncements: announcements,
          teamTrainings,
        },
      });
    } else {
      // 3. Employee Dashboard Statistics
      const employee = req.user.employeeProfile;

      // Today's attendance
      let todayAttendance = null;
      if (employee) {
        todayAttendance = await Attendance.findOne({
          employee: employee._id,
          dateString: todayStr,
        });
      }

      // Leave statistics for employee
      let leavesSummary = { applied: 0, pending: 0, approved: 0, rejected: 0 };
      let recentLeaves = [];
      if (employee) {
        const allMyLeaves = await Leave.find({ employee: employee._id });
        leavesSummary = {
          applied: allMyLeaves.length,
          pending: allMyLeaves.filter((l) => l.status === 'Pending').length,
          approved: allMyLeaves.filter((l) => l.status === 'Approved').length,
          rejected: allMyLeaves.filter((l) => l.status === 'Rejected').length,
          remainingAnnualAllowance: Math.max(
            0,
            24 -
              allMyLeaves
                .filter((l) => l.status === 'Approved' && l.leaveType === 'Annual')
                .reduce((acc, curr) => acc + curr.daysCount, 0)
          ),
        };

        recentLeaves = await Leave.find({ employee: employee._id })
          .sort({ createdAt: -1 })
          .limit(5);
      }

      // Announcements for employee
      const announcements = await Announcement.find({
        publicationStatus: 'Published',
        $or: [{ audience: 'All' }, { audience: 'Employee' }, { audience: employee?.department || '' }],
      })
        .sort({ publicationDate: -1 })
        .limit(4);

      // Available & Enrolled Trainings
      const allTrainings = await Training.find({
        status: { $in: ['Upcoming', 'Ongoing'] },
        $or: [{ department: 'All' }, { department: employee?.department || '' }],
      }).limit(6);

      const enrolledTrainings = employee
        ? allTrainings.filter((t) =>
            t.participants.some((p) => p.employee.toString() === employee._id.toString())
          )
        : [];

      // Unread notifications count
      const unreadNotifications = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      });

      return res.status(200).json({
        success: true,
        role: 'Employee',
        data: {
          employeeProfile: employee,
          todayAttendance,
          leavesSummary,
          recentLeaves,
          recentAnnouncements: announcements,
          trainings: {
            available: allTrainings,
            enrolledCount: enrolledTrainings.length,
          },
          unreadNotifications,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
