const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { createNotification } = require('../services/notificationService');

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private (Employee, Manager, HR)
const applyLeave = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile found for this account',
      });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date or end date format',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Leave end date cannot be earlier than start date',
      });
    }

    const employeeId = req.user.employeeProfile._id;

    // Detect overlapping pending or approved leave applications for the same employee
    const overlapping = await Leave.findOne({
      employee: employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `You already have an existing ${overlapping.status.toLowerCase()} leave overlapping this date range (${overlapping.startDate.toISOString().slice(0, 10)} to ${overlapping.endDate.toISOString().slice(0, 10)})`,
      });
    }

    // Calculate days count
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount,
      reason,
      status: 'Pending',
    });

    // Notify manager if assigned
    const employee = await Employee.findById(employeeId).populate('manager');
    if (employee && employee.manager) {
      const managerEmployee = await Employee.findById(employee.manager).populate('user');
      if (managerEmployee && managerEmployee.user) {
        await createNotification({
          recipient: managerEmployee.user._id,
          title: 'New Leave Application',
          message: `${employee.fullName} has applied for ${daysCount} day(s) of ${leaveType} leave.`,
          type: 'Leave',
          link: '/leaves',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personal leave history
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    if (!req.user.employeeProfile) {
      return res.status(200).json({ success: true, count: 0, leaves: [] });
    }

    const leaves = await Leave.find({ employee: req.user.employeeProfile._id })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave requests for review (HR gets all, Manager gets team)
// @route   GET /api/leaves
// @access  Private (Manager, HR)
const getLeavesForReview = async (req, res, next) => {
  try {
    const { status, leaveType } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    if (req.user.role === 'Manager') {
      // Find team members reporting to this manager
      if (!req.user.employeeProfile) {
        return res.status(200).json({ success: true, count: 0, leaves: [] });
      }
      const team = await Employee.find({ manager: req.user.employeeProfile._id }).select('_id');
      const teamIds = team.map((t) => t._id);
      query.employee = { $in: teamIds };
    }
    // HR sees all requests (no restriction)

    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'fullName employeeId department jobTitle manager',
        populate: { path: 'manager', select: 'fullName employeeId' },
      })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review (Approve/Reject) a leave request
// @route   PATCH /api/leaves/:id/review
// @access  Private (Manager for team, HR for all)
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewerComments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Approved or Rejected',
      });
    }

    const leave = await Leave.findById(req.params.id).populate({
      path: 'employee',
      populate: { path: 'user' },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `This leave request has already been ${leave.status.toLowerCase()}`,
      });
    }

    // Prevent unauthorized users from approving their own leave requests
    if (
      req.user.employeeProfile &&
      leave.employee._id.toString() === req.user.employeeProfile._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of interest: You cannot approve or reject your own leave request',
      });
    }

    // Permission verification:
    if (req.user.role === 'Manager') {
      const isTeamMember =
        leave.employee.manager &&
        leave.employee.manager.toString() === req.user.employeeProfile?._id.toString();

      if (!isTeamMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You may only review leave requests for your direct team reports',
        });
      }
    } else if (req.user.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'Only Managers and HR personnel are authorized to review leave requests',
      });
    }

    // Update leave
    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewDate = new Date();
    leave.reviewerComments = reviewerComments || '';
    await leave.save();

    // Create notification for employee
    if (leave.employee && leave.employee.user) {
      await createNotification({
        recipient: leave.employee.user._id,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} was ${status.toLowerCase()} by ${req.user.name}.${reviewerComments ? ` Comment: "${reviewerComments}"` : ''}`,
        type: 'Leave',
        link: '/leaves',
      });
    }

    const updatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'fullName employeeId department jobTitle')
      .populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending leave request (by applicant)
// @route   PATCH /api/leaves/:id/cancel
// @access  Private (Applicant only)
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found',
      });
    }

    // Must be the owner of the leave
    if (
      !req.user.employeeProfile ||
      leave.employee.toString() !== req.user.employeeProfile._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only cancel your own leave requests',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending leave requests can be cancelled. Current status is ${leave.status}`,
      });
    }

    leave.status = 'Cancelled';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave application cancelled successfully',
      leave,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getLeavesForReview,
  reviewLeave,
  cancelLeave,
};
